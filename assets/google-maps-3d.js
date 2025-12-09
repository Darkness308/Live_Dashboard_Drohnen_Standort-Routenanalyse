/* assets/google-maps-3d.js - v1
   Google Maps 3D Integration (Deutsch dokumentiert)
*/

var MORPHEUS_GMAPS = (function () {
  let map = null; const routePolylines = {}; const noisePolygons = {}; let droneMarker = null; const ISERLOHN_CENTER = { lat: 51.373, lng: 7.701 };
  function loadGoogleMapsScript(apiKey, mapId) { return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();
    const callbackName = '__gmaps_init_cb_' + Math.random().toString(36).slice(2);
    window[callbackName] = function () { delete window[callbackName]; resolve(); };
    const urlBase = 'https://maps.googleapis.com/maps/api/js';
    const params = new URLSearchParams({ key: apiKey, v: 'weekly', callback: callbackName });
    params.set('libraries', 'geometry,drawing,places'); if (mapId) params.set('map_ids', mapId);
    const script = document.createElement('script'); script.src = urlBase + '?' + params.toString(); script.async = true; script.defer = true;
    script.onerror = (err) => { delete window[callbackName]; reject(new Error('Failed to load Google Maps script: ' + err)); };
    document.head.appendChild(script);
  }); }
  async function init(containerId, options = {}) { const el = document.getElementById(containerId); if (!el) throw new Error('Container with id "' + containerId + '" not found');
    let config = {}; if (typeof MORPHEUS_API !== 'undefined' && MORPHEUS_API.fetchConfig) { try { config = await MORPHEUS_API.fetchConfig(); } catch (err) { console.warn('Could not get Maps config from backend (continuing without mapId):', err); } } else { console.warn('MORPHEUS_API.fetchConfig not available - ensure assets/api-client.js is loaded'); }
    if (!config.apiKey) { throw new Error('Google Maps API key not available. Backend must expose it via /api/config'); }
    await loadGoogleMapsScript(config.apiKey, config.mapId);
    const mapOptions = { center: options.center || ISERLOHN_CENTER, zoom: options.zoom ?? 17, mapTypeId: google.maps.MapTypeId.SATELLITE, tilt: 45, heading: 0, mapId: config.mapId || undefined, fullscreenControl: true, zoomControl: true, rotateControl: true, streetViewControl: false };
    map = new google.maps.Map(el, mapOptions);
    droneMarker = new google.maps.Marker({ map, title: 'Drohne (live)', icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 5, rotation: 0, fillColor: '#ff0000', fillOpacity: 0.9, strokeWeight: 1 }, visible: false });
    const noiseData = new google.maps.Data({ map }); noiseData.setStyle((feature) => { const level = feature.getProperty('level') || 1; const color = level >= 3 ? 'rgba(255,0,0,0.4)' : level === 2 ? 'rgba(255,165,0,0.35)' : 'rgba(0,128,255,0.25)'; return { fillColor: color, strokeColor: 'rgba(0,0,0,0.6)', strokeWeight: 1 }; }); map.__noiseDataLayer = noiseData; return; }
  function renderRoutes(routes) { if (!map) throw new Error('Map not initialized - call init() first'); if (!Array.isArray(routes)) return; routes.forEach((route) => { const id = String(route.id || route.name || Math.random()); if (routePolylines[id]) { routePolylines[id].setMap(null); delete routePolylines[id]; } const path = (route.points || []).map((p) => ({ lat: p.lat, lng: p.lng })); const polyline = new google.maps.Polyline({ path, geodesic: true, strokeColor: route.color || '#00FF00', strokeOpacity: 0.9, strokeWeight: 3, map, }); polyline.__meta = { id, name: route.name || id }; routePolylines[id] = polyline; const iw = new google.maps.InfoWindow(); polyline.addListener('click', (ev) => { iw.setContent(`<div><strong>${polyline.__meta.name}</strong><br/>Points: ${path.length}</div>`); iw.setPosition(ev.latLng); iw.open(map); }); }); }
  function renderNoiseZones(zones) { if (!map) throw new Error('Map not initialized - call init() first'); const dataLayer = map.__noiseDataLayer; if (!dataLayer) return; if (zones.type === 'FeatureCollection' || zones.type === 'Feature') { dataLayer.forEach((f) => dataLayer.remove(f)); dataLayer.addGeoJson(zones); return; } dataLayer.forEach((f) => dataLayer.remove(f)); if (!Array.isArray(zones)) return; zones.forEach((z) => { const feature = new google.maps.Data.Feature({ geometry: new google.maps.Data.Polygon([ (z.polygon || z.points || []).map(p => ({ lat: p.lat, lng: p.lng })) ]), }); feature.setProperty('id', z.id || z.name || Math.random().toString(36).slice(2)); feature.setProperty('level', z.level || 1); dataLayer.add(feature); }); }
  function updateDronePosition(payload) { if (!map || !droneMarker) return; const lat = Number(payload.lat); const lng = Number(payload.lng); if (Number.isNaN(lat) || Number.isNaN(lng)) return; const pos = new google.maps.LatLng(lat, lng); droneMarker.setPosition(pos); if (typeof payload.heading === 'number') { const icon = droneMarker.getIcon(); if (typeof icon === 'object') { icon.rotation = payload.heading; droneMarker.setIcon(icon); } } droneMarker.setVisible(true); if (payload.follow === true) { map.panTo(pos); } }
  function handleLiveUpdate(msg) { let payload = msg; if (typeof msg === 'string') { try { payload = JSON.parse(msg); } catch (err) { console.warn('Ignoring malformed live update message', msg); return; } } if (!payload || typeof payload !== 'object') return; if (payload.type === 'drone-position') { updateDronePosition(payload.data || payload); } else if (payload.type === 'route-update') { if (payload.data && Array.isArray(payload.data)) renderRoutes(payload.data); else if (payload.data) renderRoutes([payload.data]); } else if (payload.type === 'noise-update') { if (payload.data) renderNoiseZones(payload.data); } else { if (payload.lat && payload.lng) updateDronePosition(payload); } }
  return { init, renderRoutes, renderNoiseZones, updateDronePosition, handleLiveUpdate };
})();
window.MORPHEUS_GMAPS = MORPHEUS_GMAPS;
