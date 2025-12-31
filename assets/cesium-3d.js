/**
 * assets/cesium-3d.js
 *
 * MORPHEUS Dashboard - CesiumJS 3D Globe Integration
 * ===================================================
 * Immersive 3D-Visualisierung von Flugrouten mit Terrain, Gebaeuden und Laermkorridoren.
 *
 * Features:
 * - 3D Globe mit Cesium World Terrain
 * - Photorealistic 3D Tiles (Google/OSM Buildings)
 * - Animierte Flugrouten mit Hoehenprofil
 * - Laermkorridore als 3D-Volumen
 * - Kameraflug entlang Routen
 * - WebSocket Live-Tracking
 *
 * @module MORPHEUS_CESIUM
 * @version 1.0.0
 * @requires MORPHEUS_API (assets/api-client.js)
 *
 * @example
 * // Initialisierung
 * await MORPHEUS_CESIUM.init('cesium-container', { terrainEnabled: true });
 *
 * // Routen rendern
 * MORPHEUS_CESIUM.renderRoutes(routesArray);
 *
 * // Kameraflug entlang Route
 * MORPHEUS_CESIUM.flyAlongRoute('route-1', { duration: 30 });
 */

/* globals MORPHEUS_API, Cesium */

var MORPHEUS_CESIUM = (function () {
  'use strict';

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  const CONFIG = {
    // Cesium Ion Access Token wird dynamisch geladen
    // Konfiguration: Backend-Endpoint /api/v1/config oder window.CESIUM_TOKEN
    accessToken: null,

    // Default Center (Iserlohn, NRW)
    defaultCenter: {
      longitude: 7.6944,
      latitude: 51.3759,
      height: 500
    },

    // Terrain Provider
    terrainProvider: 'cesium-world-terrain',

    // 3D Tileset (OSM Buildings)
    osmBuildingsAssetId: 96188,

    // Route Visualization
    routeDefaults: {
      width: 8,
      material: {
        glowPower: 0.2,
        taperPower: 1.0
      }
    },

    // Noise Corridor Defaults
    noiseCorridorDefaults: {
      width: 100,        // Meter links/rechts der Route
      opacity: 0.3,
      colorScale: [
        { db: 35, color: [0, 255, 0, 0.2] },    // Gruen - leise
        { db: 45, color: [255, 255, 0, 0.3] },  // Gelb
        { db: 55, color: [255, 165, 0, 0.4] },  // Orange
        { db: 65, color: [255, 0, 0, 0.5] }     // Rot - laut
      ]
    },

    // Animation
    flightAnimation: {
      defaultDuration: 30,  // Sekunden
      heightOffset: 50,     // Meter ueber Route
      tilt: -30             // Kameraneigung
    }
  };

  // ===========================================================================
  // PRIVATE STATE
  // ===========================================================================

  /** @type {Cesium.Viewer|null} */
  let viewer = null;

  /** @type {Object<string, Cesium.Entity>} Route entities keyed by ID */
  const routeEntities = {};

  /** @type {Object<string, Cesium.Entity>} Noise corridor entities */
  const noiseCorridors = {};

  /** @type {Cesium.Entity|null} Live drone entity */
  let droneEntity = null;

  /** @type {boolean} */
  let isInitialized = false;

  /** @type {Cesium.Cesium3DTileset|null} */
  let buildingsTileset = null;

  // ===========================================================================
  // CESIUM LOADER
  // ===========================================================================

  /**
   * Laedt CesiumJS dynamisch
   * @returns {Promise<void>}
   */
  async function loadCesiumScript() {
    if (typeof Cesium !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      // CSS laden
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);

      // JS laden
      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Cesium.js';
      script.async = true;

      script.onload = () => {
        console.log('[CESIUM] Library loaded successfully');
        resolve();
      };

      script.onerror = () => {
        reject(new Error('[CESIUM] Failed to load CesiumJS library'));
      };

      document.head.appendChild(script);
    });
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialisiert den CesiumJS Viewer
   *
   * @param {string} containerId - DOM Container ID
   * @param {Object} [options={}] - Konfigurationsoptionen
   * @param {boolean} [options.terrainEnabled=true] - Terrain aktivieren
   * @param {boolean} [options.buildingsEnabled=true] - 3D Gebaeude aktivieren
   * @param {string} [options.accessToken] - Cesium Ion Token
   * @param {Object} [options.center] - Startzentrum {longitude, latitude, height}
   * @returns {Promise<Cesium.Viewer>}
   *
   * @example
   * await MORPHEUS_CESIUM.init('cesium-container', {
   *   terrainEnabled: true,
   *   buildingsEnabled: true,
   *   center: { longitude: 7.6944, latitude: 51.3759, height: 1000 }
   * });
   */
  async function init(containerId, options = {}) {
    if (isInitialized && viewer) {
      console.warn('[CESIUM] Already initialized');
      return viewer;
    }

    // CesiumJS laden falls nicht vorhanden
    await loadCesiumScript();

    // Token setzen
    const token = options.accessToken || await fetchTokenFromBackend() || CONFIG.accessToken;
    Cesium.Ion.defaultAccessToken = token;

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`[CESIUM] Container '${containerId}' not found`);
    }

    // Viewer erstellen
    viewer = new Cesium.Viewer(containerId, {
      terrainProvider: options.terrainEnabled !== false
        ? await Cesium.createWorldTerrainAsync()
        : undefined,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: true,
      vrButton: false,
      selectionIndicator: true,
      infoBox: true,
      shadows: true,
      shouldAnimate: true
    });

    // 3D Gebaeude laden
    if (options.buildingsEnabled !== false) {
      try {
        buildingsTileset = await Cesium.Cesium3DTileset.fromIonAssetId(CONFIG.osmBuildingsAssetId);
        viewer.scene.primitives.add(buildingsTileset);
        console.log('[CESIUM] OSM Buildings loaded');
      } catch (err) {
        console.warn('[CESIUM] Could not load OSM Buildings:', err.message);
      }
    }

    // Kamera auf Startposition
    const center = options.center || CONFIG.defaultCenter;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        center.longitude,
        center.latitude,
        center.height || 1000
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 2
    });

    // Performance-Optimierungen
    viewer.scene.globe.enableLighting = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.fog.density = 0.0001;

    isInitialized = true;
    console.log('[CESIUM] Viewer initialized');

    return viewer;
  }

  /**
   * Holt Cesium Token vom Backend
   * @returns {Promise<string|null>}
   */
  async function fetchTokenFromBackend() {
    // 1. Prüfe globale Variable (für statisches Hosting)
    if (typeof window !== 'undefined' && window.CESIUM_TOKEN) {
      return window.CESIUM_TOKEN;
    }

    // 2. Prüfe Backend-API
    if (typeof MORPHEUS_API !== 'undefined' && MORPHEUS_API.fetchConfig) {
      try {
        const config = await MORPHEUS_API.fetchConfig();
        return config?.cesiumToken || null;
      } catch (err) {
        console.warn('[CESIUM] Backend config not available:', err.message);
      }
    }

    // 3. Kein Token verfügbar - Cesium funktioniert eingeschränkt
    console.warn('[CESIUM] Kein Access Token konfiguriert. Setze window.CESIUM_TOKEN oder konfiguriere Backend.');
    return null;
  }

  // ===========================================================================
  // ROUTE RENDERING
  // ===========================================================================

  /**
   * Rendert Flugrouten als 3D-Pfade
   *
   * @param {Array<Object>} routes - Array von Routenobjekten
   * @param {string} routes[].id - Eindeutige Route-ID
   * @param {string} routes[].name - Anzeigename
   * @param {Array<Object>} routes[].waypoints - Wegpunkte [{lat, lng, alt}]
   * @param {string} [routes[].color] - Hex-Farbe (default: automatisch)
   * @param {number} [routes[].noiseLevel] - Durchschnittlicher Laermpegel in dB
   *
   * @example
   * MORPHEUS_CESIUM.renderRoutes([
   *   {
   *     id: 'route-1',
   *     name: 'Optimierte Route A',
   *     waypoints: [
   *       { lat: 51.3759, lng: 7.6944, alt: 100 },
   *       { lat: 51.3800, lng: 7.7000, alt: 120 }
   *     ],
   *     color: '#00d4ff',
   *     noiseLevel: 52
   *   }
   * ]);
   */
  function renderRoutes(routes) {
    if (!viewer) {
      console.warn('[CESIUM] Viewer not initialized');
      return;
    }

    if (!Array.isArray(routes)) {
      console.warn('[CESIUM] renderRoutes expects an array');
      return;
    }

    const colors = [
      Cesium.Color.fromCssColorString('#00d4ff'),
      Cesium.Color.fromCssColorString('#10b981'),
      Cesium.Color.fromCssColorString('#f59e0b'),
      Cesium.Color.fromCssColorString('#ef4444'),
      Cesium.Color.fromCssColorString('#8b5cf6')
    ];

    routes.forEach((route, index) => {
      const id = route.id || `route-${index}`;

      // Alte Entity entfernen
      if (routeEntities[id]) {
        viewer.entities.remove(routeEntities[id]);
      }

      if (!route.waypoints || route.waypoints.length < 2) {
        console.warn(`[CESIUM] Route "${id}" has insufficient waypoints`);
        return;
      }

      // Koordinaten fuer Cesium aufbereiten
      const positions = route.waypoints.flatMap(wp => [
        wp.lng || wp.longitude,
        wp.lat || wp.latitude,
        wp.alt || wp.altitude || wp.height || 100
      ]);

      const color = route.color
        ? Cesium.Color.fromCssColorString(route.color)
        : colors[index % colors.length];

      // Route als Polyline mit Glowing Effect
      const entity = viewer.entities.add({
        id: id,
        name: route.name || `Route ${index + 1}`,
        description: buildRouteDescription(route),
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
          width: CONFIG.routeDefaults.width,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: CONFIG.routeDefaults.material.glowPower,
            taperPower: CONFIG.routeDefaults.material.taperPower,
            color: color
          }),
          clampToGround: false
        }
      });

      routeEntities[id] = entity;

      // Wegpunkt-Marker hinzufuegen
      route.waypoints.forEach((wp, wpIndex) => {
        const isStart = wpIndex === 0;
        const isEnd = wpIndex === route.waypoints.length - 1;

        if (isStart || isEnd) {
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
              wp.lng || wp.longitude,
              wp.lat || wp.latitude,
              wp.alt || wp.altitude || 100
            ),
            point: {
              pixelSize: isStart ? 12 : 10,
              color: isStart ? Cesium.Color.LIME : Cesium.Color.RED,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.NONE
            },
            label: {
              text: isStart ? 'START' : 'ZIEL',
              font: '12px sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -15)
            }
          });
        }
      });

      console.log(`[CESIUM] Route "${route.name}" rendered with ${route.waypoints.length} waypoints`);
    });
  }

  /**
   * Baut HTML-Beschreibung fuer Route InfoBox
   * @param {Object} route
   * @returns {string}
   */
  function buildRouteDescription(route) {
    return `
      <table class="cesium-infoBox-defaultTable">
        <tr><th>Distanz</th><td>${route.distance || 'N/A'} km</td></tr>
        <tr><th>Dauer</th><td>${route.duration || 'N/A'} min</td></tr>
        <tr><th>Laermpegel</th><td>${route.noiseLevel || 'N/A'} dB(A)</td></tr>
        <tr><th>TA-Laerm</th><td>${route.compliant ? '✓ Konform' : '✗ Ueberschreitung'}</td></tr>
        <tr><th>Wegpunkte</th><td>${route.waypoints?.length || 0}</td></tr>
      </table>
    `;
  }

  // ===========================================================================
  // NOISE CORRIDORS (3D Volumes)
  // ===========================================================================

  /**
   * Rendert Laermkorridore als 3D-Volumen entlang der Routen
   *
   * @param {string} routeId - ID der Route
   * @param {Object} [options={}] - Optionen
   * @param {number} [options.width=100] - Korridorbreite in Metern
   * @param {number} [options.noiseLevel=50] - Laermpegel fuer Farbcodierung
   *
   * @example
   * MORPHEUS_CESIUM.renderNoiseCorridor('route-1', {
   *   width: 150,
   *   noiseLevel: 55
   * });
   */
  function renderNoiseCorridor(routeId, options = {}) {
    if (!viewer) {
      console.warn('[CESIUM] Viewer not initialized');
      return;
    }

    const routeEntity = routeEntities[routeId];
    if (!routeEntity || !routeEntity.polyline) {
      console.warn(`[CESIUM] Route "${routeId}" not found`);
      return;
    }

    // Alte Corridor entfernen
    if (noiseCorridors[routeId]) {
      viewer.entities.remove(noiseCorridors[routeId]);
    }

    const width = options.width || CONFIG.noiseCorridorDefaults.width;
    const noiseLevel = options.noiseLevel || 50;

    // Farbe basierend auf Laermpegel
    const color = getNoiseColor(noiseLevel);

    // Corridor als Wall (vertikale Flaeche) oder Polygon
    const positions = routeEntity.polyline.positions.getValue();

    const corridor = viewer.entities.add({
      id: `corridor-${routeId}`,
      name: `Laermkorridor ${routeId}`,
      corridor: {
        positions: positions,
        width: width,
        material: color.withAlpha(CONFIG.noiseCorridorDefaults.opacity),
        height: 0,
        extrudedHeight: 150,  // Hoehe des Korridors
        cornerType: Cesium.CornerType.ROUNDED
      }
    });

    noiseCorridors[routeId] = corridor;
    console.log(`[CESIUM] Noise corridor for "${routeId}" rendered (${noiseLevel} dB)`);
  }

  /**
   * Berechnet Farbe basierend auf Laermpegel
   * @param {number} db - Dezibel
   * @returns {Cesium.Color}
   */
  function getNoiseColor(db) {
    const scale = CONFIG.noiseCorridorDefaults.colorScale;

    for (let i = scale.length - 1; i >= 0; i--) {
      if (db >= scale[i].db) {
        const [r, g, b, a] = scale[i].color;
        return new Cesium.Color(r / 255, g / 255, b / 255, a);
      }
    }

    return new Cesium.Color(0, 1, 0, 0.2); // Default: Gruen
  }

  // ===========================================================================
  // CAMERA FLIGHT ALONG ROUTE
  // ===========================================================================

  /**
   * Animierter Kameraflug entlang einer Route
   *
   * @param {string} routeId - ID der Route
   * @param {Object} [options={}] - Flugoptionen
   * @param {number} [options.duration=30] - Flugdauer in Sekunden
   * @param {number} [options.heightOffset=50] - Hoehe ueber Route
   * @param {Function} [options.onComplete] - Callback nach Abschluss
   *
   * @example
   * MORPHEUS_CESIUM.flyAlongRoute('route-1', {
   *   duration: 45,
   *   heightOffset: 100,
   *   onComplete: () => console.log('Flug beendet')
   * });
   */
  function flyAlongRoute(routeId, options = {}) {
    if (!viewer) {
      console.warn('[CESIUM] Viewer not initialized');
      return;
    }

    const routeEntity = routeEntities[routeId];
    if (!routeEntity || !routeEntity.polyline) {
      console.warn(`[CESIUM] Route "${routeId}" not found`);
      return;
    }

    const positions = routeEntity.polyline.positions.getValue();
    if (!positions || positions.length < 2) {
      console.warn(`[CESIUM] Route "${routeId}" has no valid positions`);
      return;
    }

    const duration = options.duration || CONFIG.flightAnimation.defaultDuration;
    const heightOffset = options.heightOffset || CONFIG.flightAnimation.heightOffset;

    // Flugpfad mit Zeitstempeln erstellen
    const startTime = Cesium.JulianDate.now();
    const stopTime = Cesium.JulianDate.addSeconds(startTime, duration, new Cesium.JulianDate());

    const positionProperty = new Cesium.SampledPositionProperty();
    const timeStep = duration / (positions.length - 1);

    positions.forEach((pos, index) => {
      const time = Cesium.JulianDate.addSeconds(startTime, index * timeStep, new Cesium.JulianDate());
      const cartographic = Cesium.Cartographic.fromCartesian(pos);
      const adjustedPos = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height + heightOffset
      );
      positionProperty.addSample(time, adjustedPos);
    });

    // Temporaere Kamera-Entity
    const cameraEntity = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start: startTime, stop: stopTime })
      ]),
      position: positionProperty,
      orientation: new Cesium.VelocityOrientationProperty(positionProperty)
    });

    // Viewer Timeline konfigurieren
    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = startTime.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 1;
    viewer.clock.shouldAnimate = true;

    // Kamera an Entity binden
    viewer.trackedEntity = cameraEntity;

    console.log(`[CESIUM] Flying along route "${routeId}" (${duration}s)`);

    // Cleanup nach Flug
    if (options.onComplete) {
      setTimeout(() => {
        viewer.trackedEntity = undefined;
        viewer.entities.remove(cameraEntity);
        options.onComplete();
      }, duration * 1000 + 500);
    }
  }

  // ===========================================================================
  // LIVE DRONE TRACKING
  // ===========================================================================

  /**
   * Aktualisiert die Live-Position der Drohne
   *
   * @param {Object} position - Positionsdaten
   * @param {number} position.lat - Breitengrad
   * @param {number} position.lng - Laengengrad
   * @param {number} [position.alt=100] - Hoehe in Metern
   * @param {number} [position.heading=0] - Kurs in Grad
   * @param {string} [position.droneId] - Drohnen-ID
   *
   * @example
   * MORPHEUS_CESIUM.updateDronePosition({
   *   lat: 51.3759,
   *   lng: 7.6944,
   *   alt: 120,
   *   heading: 45,
   *   droneId: 'drone-001'
   * });
   */
  function updateDronePosition(position) {
    if (!viewer) {
      console.warn('[CESIUM] Viewer not initialized');
      return;
    }

    const { lat, lng, alt = 100, heading = 0, droneId = 'drone-001' } = position;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn('[CESIUM] Invalid drone coordinates');
      return;
    }

    const cartesianPos = Cesium.Cartesian3.fromDegrees(lng, lat, alt);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      cartesianPos,
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0)
    );

    if (!droneEntity) {
      // Drohnen-Entity erstellen
      droneEntity = viewer.entities.add({
        id: droneId,
        name: `Drohne ${droneId}`,
        position: cartesianPos,
        orientation: orientation,
        model: {
          uri: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumDrone/CesiumDrone.glb',
          minimumPixelSize: 64,
          maximumScale: 500,
          silhouetteColor: Cesium.Color.CYAN,
          silhouetteSize: 2
        },
        label: {
          text: droneId,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -50)
        }
      });

      console.log(`[CESIUM] Drone entity created: ${droneId}`);
    } else {
      // Position aktualisieren
      droneEntity.position = cartesianPos;
      droneEntity.orientation = orientation;
    }
  }

  /**
   * Verarbeitet WebSocket-Nachrichten
   * Kann direkt als Callback fuer MORPHEUS_API.connectWs() verwendet werden.
   *
   * @param {Object|string} message - WebSocket-Nachricht
   *
   * @example
   * const ws = MORPHEUS_API.connectWs(MORPHEUS_CESIUM.handleLiveUpdate);
   */
  function handleLiveUpdate(message) {
    let data = message;

    if (typeof message === 'string') {
      try {
        data = JSON.parse(message);
      } catch (err) {
        console.warn('[CESIUM] Invalid JSON message');
        return;
      }
    }

    if (data.type === 'position' && data.payload) {
      updateDronePosition(data.payload);
    } else if (data.type === 'route_update' && data.payload) {
      renderRoutes([data.payload]);
    } else if (data.type === 'noise_update' && data.payload) {
      const { routeId, noiseLevel } = data.payload;
      renderNoiseCorridor(routeId, { noiseLevel });
    }
  }

  // ===========================================================================
  // CAMERA CONTROLS
  // ===========================================================================

  /**
   * Fliegt zu einer bestimmten Position
   *
   * @param {number} longitude
   * @param {number} latitude
   * @param {number} [height=1000]
   * @param {number} [duration=2]
   */
  function flyTo(longitude, latitude, height = 1000, duration = 2) {
    if (!viewer) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: duration
    });
  }

  /**
   * Zoomt auf eine Route
   * @param {string} routeId
   */
  function zoomToRoute(routeId) {
    if (!viewer) return;

    const entity = routeEntities[routeId];
    if (entity) {
      viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, -45, 2000));
    }
  }

  /**
   * Setzt die Ansicht zurueck auf die Startposition
   */
  function resetView() {
    flyTo(
      CONFIG.defaultCenter.longitude,
      CONFIG.defaultCenter.latitude,
      CONFIG.defaultCenter.height
    );
  }

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  /**
   * Entfernt alle Routen und Korridore
   */
  function clearRoutes() {
    if (!viewer) return;

    Object.values(routeEntities).forEach(entity => {
      viewer.entities.remove(entity);
    });
    Object.keys(routeEntities).forEach(key => delete routeEntities[key]);

    Object.values(noiseCorridors).forEach(entity => {
      viewer.entities.remove(entity);
    });
    Object.keys(noiseCorridors).forEach(key => delete noiseCorridors[key]);

    console.log('[CESIUM] All routes cleared');
  }

  /**
   * Zerstoert den Viewer und gibt Ressourcen frei
   */
  function destroy() {
    if (viewer) {
      viewer.destroy();
      viewer = null;
      isInitialized = false;
      droneEntity = null;
      buildingsTileset = null;
      console.log('[CESIUM] Viewer destroyed');
    }
  }

  /**
   * Gibt den aktuellen Viewer zurueck
   * @returns {Cesium.Viewer|null}
   */
  function getViewer() {
    return viewer;
  }

  /**
   * Prueft ob der Viewer initialisiert ist
   * @returns {boolean}
   */
  function isReady() {
    return isInitialized && viewer !== null;
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  return {
    // Initialization
    init,
    destroy,
    isReady,
    getViewer,

    // Routes
    renderRoutes,
    clearRoutes,
    zoomToRoute,

    // Noise
    renderNoiseCorridor,

    // Animation
    flyAlongRoute,

    // Live Tracking
    updateDronePosition,
    handleLiveUpdate,

    // Camera
    flyTo,
    resetView
  };

})();

// Export fuer Node.js/CommonJS (Testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MORPHEUS_CESIUM;
}
