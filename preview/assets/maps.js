// MORPHEUS Dashboard - Google Maps JavaScript API Integration
// Handles map initialization, route visualization, and heatmap rendering

let map;
let heatmap;
let routePolylines = [];
let markers = [];

// Initialize Google Maps
function initMap() {
  // Default center (Berlin)
  const center = { lat: 52.520000, lng: 13.405000 };

  // Map configuration
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center,
    mapTypeId: 'roadmap',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  });

  // Initialize components
  initImmissionsortMarkers();
  initRoutePolylines();
  initHeatmap();

  // Add event listeners for route toggles
  setupRouteToggles();
}

// Get marker info window content with current language
function getMarkerInfoContent(point) {
  const lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  const labels = {
    de: { noiseLevel: 'Lärmpegel', type: 'Typ' },
    en: { noiseLevel: 'Noise Level', type: 'Type' },
  };

  return `
    <div style="padding: 8px; max-width: 200px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${point.name}</h3>
      <p style="margin: 4px 0;"><strong>${labels[lang].noiseLevel}:</strong> ${point.noiseLevel} dB(A)</p>
      <p style="margin: 4px 0;"><strong>${labels[lang].type}:</strong> ${translateType(point.type)}</p>
    </div>
  `;
}

// Initialize Immissionsorte (noise measurement points) markers
function initImmissionsortMarkers() {
  markers = [];

  immissionsorte.forEach((point) => {
    const marker = new google.maps.Marker({
      position: { lat: point.lat, lng: point.lng },
      map,
      title: point.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: getNoiseColor(point.noiseLevel),
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Info window
    const infoWindow = new google.maps.InfoWindow({
      content: getMarkerInfoContent(point),
    });

    marker.addListener('click', () => {
      // Close all other info windows
      markers.forEach((m) => m.infoWindow && m.infoWindow.close());
      // Update content to current language before opening
      infoWindow.setContent(getMarkerInfoContent(point));
      infoWindow.open(map, marker);
    });

    marker.infoWindow = infoWindow;
    markers.push(marker);
  });
}

// Initialize route polylines
function initRoutePolylines() {
  routePolylines = [];

  Object.entries(routeData).forEach(([key, route]) => {
    const polyline = new google.maps.Polyline({
      path: route.waypoints,
      geodesic: true,
      strokeColor: route.color,
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    });

    routePolylines.push({
      key,
      polyline,
      visible: true,
    });
  });
}

// Initialize heatmap
function initHeatmap() {
  const heatmapData = immissionsorte.map((point) => ({
    location: new google.maps.LatLng(point.lat, point.lng),
    weight: point.noiseLevel,
  }));

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    map: null, // Initially hidden
    radius: 50,
    opacity: 0.6,
    gradient: [
      'rgba(0, 255, 0, 0)',
      'rgba(0, 255, 0, 1)',
      'rgba(255, 255, 0, 1)',
      'rgba(255, 165, 0, 1)',
      'rgba(255, 0, 0, 1)',
    ],
  });
}

// Toggle heatmap visibility
function toggleHeatmap() {
  if (heatmap.getMap()) {
    heatmap.setMap(null);
    return false;
  }
  heatmap.setMap(map);
  return true;
}

// Toggle route visibility
function toggleRoute(routeKey) {
  const route = routePolylines.find((r) => r.key === routeKey);
  if (route) {
    route.visible = !route.visible;
    route.polyline.setMap(route.visible ? map : null);
    return route.visible;
  }
  return false;
}

// Setup route toggle event listeners
function setupRouteToggles() {
  document.querySelectorAll('[data-route-toggle]').forEach((toggle) => {
    toggle.addEventListener('change', (e) => {
      const routeKey = e.target.dataset.routeToggle;
      toggleRoute(routeKey);
    });
  });

  // Heatmap toggle
  const heatmapToggle = document.getElementById('heatmapToggle');
  if (heatmapToggle) {
    heatmapToggle.addEventListener('change', (e) => {
      toggleHeatmap();
    });
  }
}

// Get color based on noise level
function getNoiseColor(noiseLevel) {
  if (noiseLevel < 45) return '#10B981'; // Green
  if (noiseLevel < 55) return '#F59E0B'; // Amber
  if (noiseLevel < 65) return '#F97316'; // Orange
  return '#EF4444'; // Red
}

// Translate type to current language
function translateType(type) {
  const translations = {
    de: {
      residential: 'Wohngebiet',
      park: 'Park',
      commercial: 'Gewerbegebiet',
      cultural: 'Kulturstätte',
      transport: 'Verkehrsknotenpunkt',
      government: 'Behörde',
      industrial: 'Industriegebiet',
    },
    en: {
      residential: 'Residential Area',
      park: 'Park',
      commercial: 'Commercial Area',
      cultural: 'Cultural Site',
      transport: 'Transport Hub',
      government: 'Government',
      industrial: 'Industrial Area',
    },
  };

  // Get current language from global variable or default to 'de'
  const lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
  return translations[lang][type] || type;
}

// Fit map to show all routes
function fitMapToRoutes() {
  const bounds = new google.maps.LatLngBounds();

  Object.values(routeData).forEach((route) => {
    route.waypoints.forEach((waypoint) => {
      bounds.extend(waypoint);
    });
  });

  map.fitBounds(bounds);
}

// Zoom to specific route
function zoomToRoute(routeKey) {
  const route = routeData[routeKey];
  if (route) {
    const bounds = new google.maps.LatLngBounds();
    route.waypoints.forEach((waypoint) => {
      bounds.extend(waypoint);
    });
    map.fitBounds(bounds);
  }
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
  window.initMap = initMap;
  window.toggleHeatmap = toggleHeatmap;
  window.toggleRoute = toggleRoute;
  window.fitMapToRoutes = fitMapToRoutes;
  window.zoomToRoute = zoomToRoute;
}
