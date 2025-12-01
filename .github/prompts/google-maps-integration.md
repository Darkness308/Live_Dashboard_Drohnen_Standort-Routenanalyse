# Google Maps Integration Prompt - MORPHEUS Dashboard

> Specialized guide for Google Maps JavaScript API integration

## 🗺️ Google Maps Integration Framework

Dieser Prompt führt dich durch die vollständige Integration der Google Maps JavaScript API für das MORPHEUS Dashboard.

---

## 📋 Setup & Konfiguration

### 1. API-Key Management

#### 1.1 API-Key erstellen

**Schritt-für-Schritt:**

1. **Google Cloud Console öffnen**
   - URL: https://console.cloud.google.com/

2. **Projekt erstellen/auswählen**
   ```
   Navigation: Select Project → New Project
   Name: MORPHEUS Dashboard
   Click: Create
   ```

3. **APIs aktivieren**
   ```
   Navigation: APIs & Services → Library
   
   Aktiviere:
   - Maps JavaScript API (Pflicht)
   - Visualization Library (für Heatmaps)
   - Places API (optional)
   ```

4. **API-Key erstellen**
   ```
   Navigation: APIs & Services → Credentials
   Click: Create Credentials → API Key
   Copy: AIzaSy...  (Dein generierter Key)
   ```

5. **API-Key einschränken (Sicherheit)**
   ```
   Click: Restrict Key
   
   Application restrictions:
   - HTTP referrers (web sites)
   - Add: https://yourdomain.com/*
   - Add: http://localhost:8000/* (für Development)
   
   API restrictions:
   - Restrict key
   - Select: Maps JavaScript API
   - Select: Visualization Library
   
   Click: Save
   ```

#### 1.2 API-Key im Projekt verwenden

**NIEMALS hardcoden!**

```javascript
// ❌ FALSCH: Hardcodierter API-Key
const API_KEY = 'AIzaSyC...actual_key';

// ✅ RICHTIG: Aus Environment laden
function getGoogleMapsApiKey() {
  // Versuche verschiedene Quellen
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ||
                 localStorage.getItem('GOOGLE_MAPS_API_KEY') ||
                 null;
  
  // Validierung
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error(
      'Google Maps API key not configured. ' +
      'Please set GOOGLE_MAPS_API_KEY in .env file.'
    );
  }
  
  // Format-Validierung
  if (!apiKey.startsWith('AIzaSy')) {
    throw new Error(
      'Invalid Google Maps API key format. ' +
      'Key must start with "AIzaSy".'
    );
  }
  
  return apiKey;
}
```

**.env.example Template:**
```bash
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Map Configuration
DEFAULT_MAP_CENTER_LAT=51.371099
DEFAULT_MAP_CENTER_LNG=7.693150
DEFAULT_MAP_ZOOM=13
```

---

## 🏗️ Maps API Integration

### 2. API Script laden

#### 2.1 Dynamisches Script-Laden (Empfohlen)

```javascript
/**
 * Loads Google Maps JavaScript API dynamically
 * @returns {Promise<void>} Resolves when API is ready
 * @throws {Error} If API fails to load
 */
async function loadGoogleMapsApi() {
  // Check if already loaded
  if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
    console.log('[Maps API] Already loaded');
    return Promise.resolve();
  }
  
  try {
    const apiKey = getGoogleMapsApiKey();
    
    return new Promise((resolve, reject) => {
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
      script.async = true;
      script.defer = true;
      
      // Success handler
      script.onload = () => {
        console.log('[Maps API] Loaded successfully');
        resolve();
      };
      
      // Error handler
      script.onerror = (error) => {
        console.error('[Maps API] Failed to load:', error);
        reject(new Error('Failed to load Google Maps API. Check API key and network connection.'));
      };
      
      // Append to document
      document.head.appendChild(script);
    });
    
  } catch (error) {
    console.error('[Maps API] Configuration error:', error);
    throw error;
  }
}

/**
 * Initialize application after Maps API loads
 */
async function initializeApplication() {
  try {
    // Show loading indicator
    showLoadingIndicator('Loading Google Maps...');
    
    // Load Maps API
    await loadGoogleMapsApi();
    
    // Initialize map
    const map = initializeMap();
    
    // Render routes
    renderAllRoutes(map);
    
    // Add immissionsorte markers
    renderImmissionsorte(map);
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    console.log('[App] Initialization complete');
    
  } catch (error) {
    console.error('[App] Initialization failed:', error);
    showErrorMessage(
      'Failed to initialize dashboard. Please check your API key configuration.',
      error.message
    );
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
  initializeApplication();
}
```

#### 2.2 Error Handling

```javascript
/**
 * Handles Google Maps API errors
 * @param {string} errorType - Type of error
 * @param {Object} details - Error details
 */
function handleMapsApiError(errorType, details) {
  const errorMessages = {
    'InvalidKeyMapError': {
      title: 'Invalid API Key',
      message: 'Your Google Maps API key is invalid. Please check your configuration.',
      action: 'Visit Google Cloud Console to verify your API key.'
    },
    'RefererNotAllowedMapError': {
      title: 'Referrer Not Allowed',
      message: 'Your website URL is not authorized for this API key.',
      action: 'Add your domain to the API key restrictions in Google Cloud Console.'
    },
    'QuotaExceededError': {
      title: 'Quota Exceeded',
      message: 'Your API quota has been exceeded.',
      action: 'Check your usage in Google Cloud Console and consider upgrading your plan.'
    },
    'NetworkError': {
      title: 'Network Error',
      message: 'Failed to connect to Google Maps servers.',
      action: 'Check your internet connection and try again.'
    }
  };
  
  const error = errorMessages[errorType] || {
    title: 'Unknown Error',
    message: 'An unknown error occurred while loading Google Maps.',
    action: 'Please try refreshing the page.'
  };
  
  console.error(`[Maps API Error] ${error.title}:`, details);
  
  // Display user-friendly error message
  showErrorDialog({
    title: error.title,
    message: error.message,
    action: error.action,
    details: details
  });
}

// Listen for global Google Maps errors
window.gm_authFailure = function() {
  handleMapsApiError('InvalidKeyMapError', {
    timestamp: new Date().toISOString()
  });
};
```

---

### 3. Map Initialisierung

#### 3.1 Basis-Konfiguration

```javascript
/**
 * Initializes Google Maps instance with MORPHEUS configuration
 * @returns {google.maps.Map} Initialized map instance
 * @throws {Error} If map container not found or Maps API not loaded
 */
function initializeMap() {
  // Validate Maps API loaded
  if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
    throw new Error('Google Maps API not loaded. Call loadGoogleMapsApi() first.');
  }
  
  // Get map container
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    throw new Error('Map container element #map not found in DOM.');
  }
  
  // Iserlohn, Germany - MORPHEUS Base Location
  const ISERLOHN_CENTER = {
    lat: 51.371099,  // Exactly 6 decimal places
    lng: 7.693150
  };
  
  // Map configuration
  const mapOptions = {
    center: ISERLOHN_CENTER,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.HYBRID,  // Satellite + Labels
    
    // UI Controls
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP
    },
    
    // Interaction
    gestureHandling: 'greedy',  // No Ctrl+scroll requirement
    scrollwheel: true,
    disableDoubleClickZoom: false,
    
    // Styling
    styles: getMapStyles(),  // Custom styling for better visibility
    
    // Performance
    clickableIcons: false,  // Disable default POI clicks
    disableDefaultUI: false
  };
  
  // Create map
  const map = new google.maps.Map(mapContainer, mapOptions);
  
  console.log('[Maps] Initialized at', ISERLOHN_CENTER);
  
  // Add event listeners
  addMapEventListeners(map);
  
  // Store reference globally
  window.morpheusMap = map;
  
  return map;
}

/**
 * Custom map styling for better route visibility
 * @returns {Array} Google Maps style array
 */
function getMapStyles() {
  return [
    {
      // Reduce POI visibility
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      // Emphasize roads
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ lightness: 10 }]
    },
    {
      // Subtle water
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9e0f0' }]
    }
  ];
}
```

#### 3.2 Event Listeners

```javascript
/**
 * Adds event listeners to map for logging and interaction
 * @param {google.maps.Map} map - Map instance
 */
function addMapEventListeners(map) {
  // Zoom changed
  map.addListener('zoom_changed', debounce(() => {
    const zoom = map.getZoom();
    console.log('[Maps] Zoom changed to', zoom);
    
    // Adjust marker visibility based on zoom
    updateMarkerVisibility(zoom);
  }, 300));
  
  // Center changed (dragged)
  map.addListener('center_changed', debounce(() => {
    const center = map.getCenter();
    console.log('[Maps] Center changed to', {
      lat: center.lat().toFixed(6),
      lng: center.lng().toFixed(6)
    });
  }, 500));
  
  // Map clicked
  map.addListener('click', (event) => {
    const clickedLat = event.latLng.lat();
    const clickedLng = event.latLng.lng();
    
    console.log('[Maps] Map clicked at', {
      lat: clickedLat.toFixed(6),
      lng: clickedLng.toFixed(6)
    });
    
    // Optional: Add temporary marker at click location
    // showTemporaryMarker(event.latLng);
  });
  
  // Map type changed
  map.addListener('maptypeid_changed', () => {
    const mapType = map.getMapTypeId();
    console.log('[Maps] Map type changed to', mapType);
  });
}

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

---

### 4. Route Rendering

#### 4.1 Polyline für Routen

```javascript
/**
 * Renders a drone route as a polyline on the map
 * @param {google.maps.Map} map - Map instance
 * @param {Object} route - Route data object
 * @param {string} routeId - Unique route identifier
 * @returns {google.maps.Polyline} The created polyline
 * @throws {Error} If GPS validation fails
 */
function renderRoute(map, route, routeId) {
  console.log(`[Maps] Rendering route: ${routeId}`, route);
  
  // Validate all waypoints (6 decimal precision)
  route.waypoints.forEach((waypoint, index) => {
    if (!validateGpsCoordinates(waypoint.lat, waypoint.lng)) {
      throw new Error(
        `Invalid GPS at ${routeId} waypoint ${index}: ` +
        `lat=${waypoint.lat}, lng=${waypoint.lng}. ` +
        `Coordinates must have exactly 6 decimal places.`
      );
    }
  });
  
  // Create polyline
  const polyline = new google.maps.Polyline({
    path: route.waypoints,
    geodesic: true,  // Account for Earth curvature
    strokeColor: route.color,
    strokeOpacity: 0.8,
    strokeWeight: 4,
    map: map,
    clickable: true,
    zIndex: 100
  });
  
  // Store reference for later manipulation
  if (!window.routePolylines) {
    window.routePolylines = {};
  }
  window.routePolylines[routeId] = polyline;
  
  // Add click listener for info
  polyline.addListener('click', (event) => {
    showRouteInfo(route, event.latLng);
  });
  
  // Add waypoint markers
  route.waypoints.forEach((waypoint, index) => {
    renderWaypointMarker(map, waypoint, route, index, routeId);
  });
  
  console.log(`[Maps] Route ${routeId} rendered successfully`);
  
  return polyline;
}

/**
 * Renders all routes from routeData
 * @param {google.maps.Map} map - Map instance
 */
function renderAllRoutes(map) {
  Object.keys(routeData).forEach(routeId => {
    try {
      renderRoute(map, routeData[routeId], routeId);
    } catch (error) {
      console.error(`[Maps] Failed to render ${routeId}:`, error);
    }
  });
}

/**
 * Toggles route visibility
 * @param {string} routeId - Route identifier
 * @param {boolean} visible - Show or hide
 */
function toggleRouteVisibility(routeId, visible) {
  const polyline = window.routePolylines?.[routeId];
  
  if (polyline) {
    polyline.setVisible(visible);
    console.log(`[Maps] Route ${routeId} visibility: ${visible}`);
    
    // Also toggle waypoint markers
    toggleWaypointMarkers(routeId, visible);
    
    // Update UI
    updateRouteToggleButton(routeId, visible);
  } else {
    console.warn(`[Maps] Route ${routeId} not found`);
  }
}
```

#### 4.2 Waypoint Markers

```javascript
/**
 * Renders a waypoint marker on the map
 * @param {google.maps.Map} map - Map instance
 * @param {Object} waypoint - GPS coordinates
 * @param {Object} route - Route data
 * @param {number} index - Waypoint index
 * @param {string} routeId - Route identifier
 * @returns {google.maps.Marker} The created marker
 */
function renderWaypointMarker(map, waypoint, route, index, routeId) {
  const marker = new google.maps.Marker({
    position: waypoint,
    map: map,
    title: `${route.name} - Waypoint ${index + 1}`,
    label: {
      text: `${index + 1}`,
      color: '#FFFFFF',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: route.color,
      fillOpacity: 0.9,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    },
    zIndex: 200
  });
  
  // Store reference
  if (!window.waypointMarkers) {
    window.waypointMarkers = {};
  }
  if (!window.waypointMarkers[routeId]) {
    window.waypointMarkers[routeId] = [];
  }
  window.waypointMarkers[routeId].push(marker);
  
  // Add info window
  const infoWindow = new google.maps.InfoWindow({
    content: createWaypointInfoContent(route, waypoint, index)
  });
  
  marker.addListener('click', () => {
    // Close other info windows
    closeAllInfoWindows();
    
    // Open this info window
    infoWindow.open(map, marker);
    window.currentInfoWindow = infoWindow;
  });
  
  return marker;
}

/**
 * Creates HTML content for waypoint info window
 * @param {Object} route - Route data
 * @param {Object} waypoint - GPS coordinates
 * @param {number} index - Waypoint index
 * @returns {string} HTML content
 */
function createWaypointInfoContent(route, waypoint, index) {
  return `
    <div class="info-window" style="font-family: Arial, sans-serif; min-width: 200px;">
      <h3 style="margin: 0 0 10px 0; color: ${route.color};">
        ${route.name}
      </h3>
      <div style="margin-bottom: 8px;">
        <strong>Waypoint:</strong> ${index + 1}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>GPS:</strong><br>
        Lat: ${waypoint.lat.toFixed(6)}<br>
        Lng: ${waypoint.lng.toFixed(6)}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Distanz:</strong> ${route.distance} km
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Dauer:</strong> ${route.duration} min
      </div>
      <div>
        <strong>TA Lärm:</strong> 
        <span style="color: ${route.taCompliance ? '#10B981' : '#EF4444'}; font-weight: bold;">
          ${route.taCompliance ? '✓ Konform' : '✗ Nicht konform'}
        </span>
      </div>
    </div>
  `;
}
```

---

### 5. Immissionsorte (Noise Measurement Points)

#### 5.1 Immissionsort Markers

```javascript
/**
 * Renders all immissionsorte (noise measurement points)
 * @param {google.maps.Map} map - Map instance
 */
function renderImmissionsorte(map) {
  immissionsorte.forEach(immissionsort => {
    renderImmissionsortMarker(map, immissionsort);
  });
  
  console.log(`[Maps] Rendered ${immissionsorte.length} immissionsorte`);
}

/**
 * Renders a single immissionsort marker
 * @param {google.maps.Map} map - Map instance
 * @param {Object} immissionsort - Measurement point data
 * @returns {google.maps.Marker} The created marker
 */
function renderImmissionsortMarker(map, immissionsort) {
  // Validate GPS
  if (!validateGpsCoordinates(immissionsort.lat, immissionsort.lng)) {
    console.error(`[Maps] Invalid GPS for immissionsort ${immissionsort.id}`);
    return null;
  }
  
  // Determine color based on noise level and TA Lärm compliance
  const color = getNoiseColor(immissionsort.noiseLevel, immissionsort.type);
  
  const marker = new google.maps.Marker({
    position: { lat: immissionsort.lat, lng: immissionsort.lng },
    map: map,
    title: immissionsort.name,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    },
    zIndex: 300
  });
  
  // Info window
  const infoWindow = new google.maps.InfoWindow({
    content: createImmissionsortInfoContent(immissionsort)
  });
  
  marker.addListener('click', () => {
    closeAllInfoWindows();
    infoWindow.open(map, marker);
    window.currentInfoWindow = infoWindow;
  });
  
  // Store reference
  if (!window.immissionsortMarkers) {
    window.immissionsortMarkers = [];
  }
  window.immissionsortMarkers.push(marker);
  
  return marker;
}

/**
 * Determines marker color based on noise level and TA Lärm compliance
 * @param {number} noiseLevel - Noise level in dB(A)
 * @param {string} areaType - Area type (residential/commercial/industrial)
 * @returns {string} Hex color code
 */
function getNoiseColor(noiseLevel, areaType) {
  const thresholds = {
    residential: { day: 55, night: 40 },
    commercial: { day: 65, night: 50 },
    industrial: { day: 70, night: 70 }
  };
  
  const dayLimit = thresholds[areaType]?.day || 55;
  
  if (noiseLevel <= 40) return '#10B981';  // Green - very low
  if (noiseLevel <= dayLimit) return '#3B82F6';  // Blue - acceptable
  if (noiseLevel <= dayLimit + 10) return '#F59E0B';  // Orange - warning
  return '#EF4444';  // Red - exceeds limits
}

/**
 * Creates HTML content for immissionsort info window
 * @param {Object} immissionsort - Measurement point data
 * @returns {string} HTML content
 */
function createImmissionsortInfoContent(immissionsort) {
  const compliance = checkTaLaermCompliance(
    immissionsort.noiseLevel,
    immissionsort.type,
    'day'
  );
  
  return `
    <div class="info-window" style="font-family: Arial, sans-serif; min-width: 220px;">
      <h3 style="margin: 0 0 10px 0; color: #1F2937;">
        ${immissionsort.name}
      </h3>
      <div style="margin-bottom: 8px;">
        <strong>Typ:</strong> ${translateAreaType(immissionsort.type)}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>GPS:</strong><br>
        ${immissionsort.lat.toFixed(6)}, ${immissionsort.lng.toFixed(6)}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Lärmbelastung:</strong> 
        <span style="font-size: 18px; font-weight: bold;">
          ${immissionsort.noiseLevel} dB(A)
        </span>
      </div>
      <div>
        <strong>TA Lärm Status:</strong>
        <span style="color: ${compliance ? '#10B981' : '#EF4444'}; font-weight: bold;">
          ${compliance ? '✓ Konform' : '✗ Überschritten'}
        </span>
      </div>
    </div>
  `;
}
```

---

### 6. Heatmap Layer

#### 6.1 Noise Heatmap

```javascript
/**
 * Creates and renders noise heatmap layer
 * @param {google.maps.Map} map - Map instance
 * @returns {google.maps.visualization.HeatmapLayer} Heatmap layer
 */
function renderNoiseHeatmap(map) {
  // Check if visualization library is loaded
  if (typeof google.maps.visualization === 'undefined') {
    console.error('[Maps] Visualization library not loaded');
    return null;
  }
  
  // Prepare heatmap data
  const heatmapData = immissionsorte.map(immissionsort => {
    return {
      location: new google.maps.LatLng(immissionsort.lat, immissionsort.lng),
      weight: immissionsort.noiseLevel
    };
  });
  
  // Create heatmap layer
  const heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: map,
    radius: 50,  // Radius in pixels
    opacity: 0.6,
    
    // Gradient from green (low) to red (high)
    gradient: [
      'rgba(0, 255, 0, 0)',     // Transparent green
      'rgba(0, 255, 0, 1)',     // Green (low noise)
      'rgba(255, 255, 0, 1)',   // Yellow (moderate)
      'rgba(255, 165, 0, 1)',   // Orange (warning)
      'rgba(255, 0, 0, 1)'      // Red (high noise)
    ],
    
    // Max intensity
    maxIntensity: 80,  // Max noise level for visualization
    
    // Initially hidden
    visible: false
  });
  
  // Store reference
  window.noiseHeatmap = heatmap;
  
  console.log('[Maps] Heatmap created with', heatmapData.length, 'points');
  
  return heatmap;
}

/**
 * Toggles heatmap visibility
 * @param {boolean} visible - Show or hide
 */
function toggleHeatmap(visible) {
  if (window.noiseHeatmap) {
    window.noiseHeatmap.setMap(visible ? window.morpheusMap : null);
    console.log(`[Maps] Heatmap visibility: ${visible}`);
    
    // Update UI button
    const button = document.getElementById('toggleHeatmap');
    if (button) {
      button.setAttribute('aria-pressed', visible.toString());
      button.classList.toggle('active', visible);
    }
  }
}
```

---

## ✅ Testing & Validation

### API Integration Checklist
- [ ] API-Key korrekt konfiguriert
- [ ] Maps JavaScript API aktiviert
- [ ] Visualization Library aktiviert
- [ ] Script lädt ohne Fehler
- [ ] Map wird korrekt initialisiert
- [ ] Alle 3 Routen werden gerendert
- [ ] GPS-Koordinaten haben 6 Dezimalstellen
- [ ] Waypoint-Marker sichtbar
- [ ] Immissionsorte-Marker sichtbar
- [ ] Info-Windows funktionieren
- [ ] Heatmap wird korrekt angezeigt
- [ ] Toggle-Controls funktionieren
- [ ] Keine Console-Errors

### Performance Checklist
- [ ] Map lädt in <3 Sekunden
- [ ] Smooth Zoom/Pan
- [ ] Marker Clustering bei >100 Markern
- [ ] Event Debouncing implementiert

---

## 📚 Referenzen

- **[Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)**
- **[Visualization Library](https://developers.google.com/maps/documentation/javascript/visualization)**
- **[AGENTS.md](../../AGENTS.md)**: GPS-Koordinaten Standards
- **[copilot-instructions.md](../copilot-instructions.md)**: Projekt-Richtlinien

---

**Google Maps Integration Complete!** 🗺️

Eine erfolgreiche Maps-Integration ist das Herzstück des MORPHEUS Dashboards.
