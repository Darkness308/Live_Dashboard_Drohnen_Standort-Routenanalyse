/**
 * assets/google-maps-3d.js
 *
 * MORPHEUS Dashboard - Google Maps 3D Integration
 * ================================================
 * Erweiterte Kartenvisualisierung mit 3D-Ansicht, Live-Tracking und Lärmzonen.
 *
 * Features:
 * - Dynamisches Laden des Google Maps Scripts
 * - 3D Satellite View mit Tilt & Rotation
 * - Live Drone Marker mit Heading-Rotation
 * - Route Polylines mit Click-Info
 * - Noise Zone Polygons (GeoJSON-kompatibel)
 * - WebSocket Integration für Echtzeit-Updates
 *
 * @module MORPHEUS_GMAPS
 * @version 1.0.0
 * @requires MORPHEUS_API (assets/api-client.js)
 *
 * @example
 * // Initialisierung
 * await MORPHEUS_GMAPS.init('map-container', { zoom: 17 });
 *
 * // Routen rendern
 * MORPHEUS_GMAPS.renderRoutes(routesArray);
 *
 * // WebSocket-Nachrichten verarbeiten
 * const ws = MORPHEUS_API.connectWs(MORPHEUS_GMAPS.handleLiveUpdate);
 */

/* globals MORPHEUS_API, google */

var MORPHEUS_GMAPS = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** @type {google.maps.Map|null} */
  let map = null;

  /** @type {Object<string, google.maps.Polyline>} Routen-Polylines keyed by ID */
  const routePolylines = {};

  /** @type {Object<string, google.maps.Polygon>} Noise polygons keyed by ID */
  const noisePolygons = {};

  /** @type {google.maps.Marker|null} Marker für Drohnenposition */
  let droneMarker = null;

  /** Standardzentrum: Iserlohn (kann überschrieben werden) */
  const DEFAULT_CENTER = { lat: 51.373, lng: 7.701 };

  /** Berlin-Zentrum als Alternative */
  const BERLIN_CENTER = { lat: 52.4631, lng: 13.3484 };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCRIPT LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lädt das Google Maps Script dynamisch mit API-Key und optionaler Map-ID
   *
   * @param {string} apiKey - Google Maps API Key
   * @param {string} [mapId] - Optional: Cloud-basierte Map-ID für Styling
   * @returns {Promise<void>}
   * @private
   */
  function loadGoogleMapsScript(apiKey, mapId) {
    return new Promise((resolve, reject) => {
      // Falls bereits geladen, sofort resolve
      if (window.google && window.google.maps) {
        console.debug('[GMAPS] Script already loaded');
        return resolve();
      }

      // Eindeutiger Callback-Name
      const callbackName = '__gmaps_init_cb_' + Math.random().toString(36).slice(2);

      window[callbackName] = function () {
        delete window[callbackName];
        console.debug('[GMAPS] Script loaded successfully');
        resolve();
      };

      // URL zusammenbauen
      const urlBase = 'https://maps.googleapis.com/maps/api/js';
      const params = new URLSearchParams({
        key: apiKey,
        v: 'weekly',
        callback: callbackName,
        libraries: 'geometry,drawing,places',
      });

      if (mapId) {
        params.set('map_ids', mapId);
      }

      // Script-Element erstellen
      const script = document.createElement('script');
      script.src = `${urlBase}?${params.toString()}`;
      script.async = true;
      script.defer = true;

      script.onerror = (err) => {
        delete window[callbackName];
        console.error('[GMAPS] Failed to load script:', err);
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initialisiert die Google Maps 3D-Instanz in einem Container.
   * Holt API-Key und mapId automatisch vom Backend via MORPHEUS_API.
   *
   * @param {string} containerId - DOM-Element ID für die Karte
   * @param {Object} [options={}] - Optionale Konfiguration
   * @param {number} [options.zoom=17] - Zoom-Level
   * @param {{lat: number, lng: number}} [options.center] - Kartenzentrum
   * @param {boolean} [options.use3D=true] - 3D-Ansicht aktivieren
   * @returns {Promise<void>}
   *
   * @example
   * await MORPHEUS_GMAPS.init('google-map', {
   *   zoom: 18,
   *   center: { lat: 52.52, lng: 13.405 },
   *   use3D: true
   * });
   */
  async function init(containerId, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Container mit ID "${containerId}" nicht gefunden`);
    }

    // Config vom Backend beziehen (apiKey, mapId)
    let config = {};

    if (typeof MORPHEUS_API !== 'undefined' && MORPHEUS_API.fetchConfig) {
      try {
        config = await MORPHEUS_API.fetchConfig();
        console.debug('[GMAPS] Config from backend:', config);
      } catch (err) {
        console.warn('[GMAPS] Backend config nicht verfügbar:', err.message);
      }
    } else {
      console.warn('[GMAPS] MORPHEUS_API nicht geladen - assets/api-client.js einbinden');
    }

    // API Key prüfen
    if (!config.apiKey) {
      throw new Error(
        'Google Maps API Key nicht verfügbar. ' +
        'Backend muss ihn via /api/config bereitstellen oder GOOGLE_MAPS_API_KEY setzen.'
      );
    }

    // Script laden
    await loadGoogleMapsScript(config.apiKey, config.mapId);

    // Map-Optionen zusammenstellen
    const use3D = options.use3D !== false;
    const mapOptions = {
      center: options.center || DEFAULT_CENTER,
      zoom: options.zoom ?? 17,
      mapTypeId: use3D ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP,
      tilt: use3D ? 45 : 0,
      heading: 0,
      mapId: config.mapId || undefined,

      // Controls
      fullscreenControl: true,
      zoomControl: true,
      rotateControl: use3D,
      streetViewControl: false,
      mapTypeControl: true,
      scaleControl: true,
    };

    // Map erstellen
    map = new google.maps.Map(el, mapOptions);
    console.debug('[GMAPS] Map initialized');

    // Drohnen-Marker erstellen (initial unsichtbar)
    droneMarker = new google.maps.Marker({
      map,
      title: 'Drohne (Live)',
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        rotation: 0,
        fillColor: '#00d4ff',
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      visible: false,
      zIndex: 1000,
    });

    // Data Layer für Lärmzonen (GeoJSON-kompatibel)
    const noiseDataLayer = new google.maps.Data({ map });
    noiseDataLayer.setStyle((feature) => {
      const level = feature.getProperty('level') || 1;

      // Farbkodierung nach Lärmpegel
      let fillColor;
      if (level >= 3) {
        fillColor = 'rgba(239, 68, 68, 0.4)';   // Rot - Kritisch
      } else if (level === 2) {
        fillColor = 'rgba(245, 158, 11, 0.35)'; // Orange - Warnung
      } else {
        fillColor = 'rgba(16, 185, 129, 0.25)'; // Grün - OK
      }

      return {
        fillColor,
        strokeColor: 'rgba(255, 255, 255, 0.6)',
        strokeWeight: 1,
      };
    });

    // InfoWindow für Klicks auf Lärmzonen
    const infoWindow = new google.maps.InfoWindow();
    noiseDataLayer.addListener('click', (event) => {
      const level = event.feature.getProperty('level');
      const id = event.feature.getProperty('id');
      const levelText = level >= 3 ? 'Kritisch' : level === 2 ? 'Warnung' : 'OK';

      infoWindow.setContent(`
        <div style="padding: 8px; font-family: system-ui;">
          <strong>Lärmzone ${id}</strong><br/>
          Level: ${level} (${levelText})
        </div>
      `);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    });

    // Referenz speichern für spätere Verwendung
    map.__noiseDataLayer = noiseDataLayer;
    map.__infoWindow = infoWindow;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Rendert Routen als Polylines auf der Karte
   *
   * @param {Array<Object>} routes - Array von Route-Objekten
   * @param {string} routes[].id - Route-ID
   * @param {string} routes[].name - Route-Name
   * @param {string} [routes[].color] - Linienfarbe (Hex)
   * @param {Array<{lat: number, lng: number}>} routes[].points - Wegpunkte
   *
   * @example
   * MORPHEUS_GMAPS.renderRoutes([
   *   {
   *     id: 'route-a',
   *     name: 'Route A - Optimiert',
   *     color: '#22C55E',
   *     points: [{ lat: 52.52, lng: 13.405 }, ...]
   *   }
   * ]);
   */
  function renderRoutes(routes) {
    if (!map) {
      throw new Error('Map nicht initialisiert - zuerst init() aufrufen');
    }

    if (!Array.isArray(routes)) {
      console.warn('[GMAPS] renderRoutes erwartet ein Array');
      return;
    }

    routes.forEach((route) => {
      const id = String(route.id || route.name || Math.random().toString(36).slice(2));

      // Bestehende Polyline entfernen
      if (routePolylines[id]) {
        routePolylines[id].setMap(null);
        delete routePolylines[id];
      }

      // Punkte konvertieren
      const path = (route.points || []).map((p) => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
      }));

      if (path.length === 0) {
        console.warn(`[GMAPS] Route "${id}" hat keine Punkte`);
        return;
      }

      // Polyline erstellen
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: route.color || '#00d4ff',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
        zIndex: 100,
      });

      // Metadata speichern
      polyline.__meta = {
        id,
        name: route.name || id,
        pointCount: path.length,
      };

      routePolylines[id] = polyline;

      // Click-Handler für Info
      const infoWindow = map.__infoWindow || new google.maps.InfoWindow();
      polyline.addListener('click', (ev) => {
        infoWindow.setContent(`
          <div style="padding: 8px; font-family: system-ui;">
            <strong style="color: ${route.color || '#00d4ff'}">${polyline.__meta.name}</strong><br/>
            Punkte: ${polyline.__meta.pointCount}
          </div>
        `);
        infoWindow.setPosition(ev.latLng);
        infoWindow.open(map);
      });
    });

    console.debug(`[GMAPS] ${routes.length} Routen gerendert`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOISE ZONE RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Rendert Lärmzonen als Polygone (GeoJSON oder Array-Format)
   *
   * @param {Array|Object} zones - Lärmzonen-Daten
   *
   * @example
   * // Array-Format
   * MORPHEUS_GMAPS.renderNoiseZones([
   *   { id: 'zone-1', level: 2, polygon: [{ lat, lng }, ...] }
   * ]);
   *
   * // GeoJSON-Format
   * MORPHEUS_GMAPS.renderNoiseZones({
   *   type: 'FeatureCollection',
   *   features: [...]
   * });
   */
  function renderNoiseZones(zones) {
    if (!map) {
      throw new Error('Map nicht initialisiert - zuerst init() aufrufen');
    }

    const dataLayer = map.__noiseDataLayer;
    if (!dataLayer) {
      console.warn('[GMAPS] Noise Data Layer nicht verfügbar');
      return;
    }

    // Bestehende Features entfernen
    dataLayer.forEach((f) => dataLayer.remove(f));

    // GeoJSON direkt laden
    if (zones && (zones.type === 'FeatureCollection' || zones.type === 'Feature')) {
      dataLayer.addGeoJson(zones);
      console.debug('[GMAPS] GeoJSON Lärmzonen geladen');
      return;
    }

    // Array-Format verarbeiten
    if (!Array.isArray(zones)) {
      console.warn('[GMAPS] renderNoiseZones erwartet Array oder GeoJSON');
      return;
    }

    zones.forEach((zone) => {
      const points = zone.polygon || zone.points || [];
      if (points.length < 3) return;

      const coordinates = points.map((p) => ({
        lat: Number(p.lat),
        lng: Number(p.lng),
      }));

      const feature = new google.maps.Data.Feature({
        geometry: new google.maps.Data.Polygon([coordinates]),
      });

      feature.setProperty('id', zone.id || Math.random().toString(36).slice(2));
      feature.setProperty('level', zone.level || 1);
      feature.setProperty('name', zone.name || '');

      dataLayer.add(feature);
    });

    console.debug(`[GMAPS] ${zones.length} Lärmzonen gerendert`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIVE DRONE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Aktualisiert die Live-Drohnenposition auf der Karte
   *
   * @param {Object} payload - Positionsdaten
   * @param {number} payload.lat - Latitude
   * @param {number} payload.lng - Longitude
   * @param {number} [payload.alt] - Altitude (für zukünftige 3D-Darstellung)
   * @param {number} [payload.heading] - Flugrichtung in Grad
   * @param {boolean} [payload.follow=false] - Kamera folgt Drohne
   */
  function updateDronePosition(payload) {
    if (!map || !droneMarker) {
      console.warn('[GMAPS] Map/Marker nicht initialisiert');
      return;
    }

    const lat = Number(payload.lat);
    const lng = Number(payload.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.warn('[GMAPS] Ungültige Koordinaten:', payload);
      return;
    }

    const pos = new google.maps.LatLng(lat, lng);
    droneMarker.setPosition(pos);

    // Heading aktualisieren (Pfeil-Rotation)
    if (typeof payload.heading === 'number') {
      const icon = droneMarker.getIcon();
      if (typeof icon === 'object') {
        icon.rotation = payload.heading;
        droneMarker.setIcon(icon);
      }
    }

    droneMarker.setVisible(true);

    // Kamera folgen
    if (payload.follow === true) {
      map.panTo(pos);
    }
  }

  /**
   * Versteckt den Drohnen-Marker
   */
  function hideDrone() {
    if (droneMarker) {
      droneMarker.setVisible(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSOCKET MESSAGE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verarbeitet eingehende WebSocket-Nachrichten und aktualisiert die Karte.
   * Kann direkt als Callback für MORPHEUS_API.connectWs() verwendet werden.
   *
   * @param {Object|string} msg - Nachricht vom WebSocket
   *
   * @example
   * // Direkte Verwendung mit API Client
   * const ws = MORPHEUS_API.connectWs(MORPHEUS_GMAPS.handleLiveUpdate);
   */
  function handleLiveUpdate(msg) {
    let payload = msg;

    // String zu JSON parsen
    if (typeof msg === 'string') {
      try {
        payload = JSON.parse(msg);
      } catch {
        console.warn('[GMAPS] Ungültige JSON-Nachricht:', msg);
        return;
      }
    }

    if (!payload || typeof payload !== 'object') {
      return;
    }

    // Nachrichtentypen verarbeiten
    switch (payload.type) {
      case 'drone-position':
        updateDronePosition(payload.data || payload);
        break;

      case 'route-update':
        if (payload.data) {
          const routes = Array.isArray(payload.data) ? payload.data : [payload.data];
          renderRoutes(routes);
        }
        break;

      case 'noise-update':
        if (payload.data) {
          renderNoiseZones(payload.data);
        }
        break;

      default:
        // Fallback: Direkte Koordinaten als Drohnenposition
        if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
          updateDronePosition(payload);
        }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Zentriert die Karte auf bestimmte Koordinaten
   *
   * @param {number} lat
   * @param {number} lng
   * @param {number} [zoom] - Optionaler neuer Zoom-Level
   */
  function panTo(lat, lng, zoom) {
    if (!map) return;
    map.panTo({ lat, lng });
    if (typeof zoom === 'number') {
      map.setZoom(zoom);
    }
  }

  /**
   * Setzt Tilt und Heading für 3D-Ansicht
   *
   * @param {number} tilt - Neigung (0-67.5)
   * @param {number} heading - Rotation (0-360)
   */
  function setView3D(tilt, heading) {
    if (!map) return;
    map.setTilt(tilt);
    map.setHeading(heading);
  }

  /**
   * Gibt die aktuelle Map-Instanz zurück (für erweiterte Nutzung)
   *
   * @returns {google.maps.Map|null}
   */
  function getMap() {
    return map;
  }

  /**
   * Entfernt alle Routen von der Karte
   */
  function clearRoutes() {
    Object.values(routePolylines).forEach((p) => p.setMap(null));
    Object.keys(routePolylines).forEach((k) => delete routePolylines[k]);
  }

  /**
   * Entfernt alle Lärmzonen von der Karte
   */
  function clearNoiseZones() {
    if (map && map.__noiseDataLayer) {
      map.__noiseDataLayer.forEach((f) => map.__noiseDataLayer.remove(f));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC INTERFACE
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Initialization
    init,

    // Rendering
    renderRoutes,
    renderNoiseZones,

    // Live Tracking
    updateDronePosition,
    hideDrone,
    handleLiveUpdate,

    // Utilities
    panTo,
    setView3D,
    getMap,
    clearRoutes,
    clearNoiseZones,

    // Constants
    DEFAULT_CENTER,
    BERLIN_CENTER,
  };
})();

// Global export
if (typeof window !== 'undefined') {
  window.MORPHEUS_GMAPS = MORPHEUS_GMAPS;
}
