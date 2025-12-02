// MORPHEUS Dashboard - Leaflet.js Interactive Map Module
// 3D Terrain visualization with route variants and noise zones

// Global map instance
let leafletMap = null;
let routeLayers = {};
let markerLayers = {};
let noiseZoneLayers = {};
let heatmapLayer = null;
let terrainEnabled = true;

// Map data storage
let mapData = {
    routes: null,
    locations: null,
    noiseZones: null
};

// Current language
let mapLang = 'de';

// Custom icons for markers
const createCustomIcon = (type, color) => {
    const iconConfigs = {
        start: {
            html: `<div class="custom-marker start-marker" style="background-color: ${color}">
                     <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                       <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                       <circle cx="12" cy="9" r="2.5" fill="${color}"/>
                     </svg>
                   </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        },
        hospital: {
            html: `<div class="custom-marker hospital-marker" style="background-color: ${color}">
                     <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                       <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
                     </svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        },
        noise_sensor: {
            html: `<div class="custom-marker sensor-marker" style="background-color: ${color}">
                     <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                       <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                     </svg>
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        }
    };

    const config = iconConfigs[type] || iconConfigs.noise_sensor;
    return L.divIcon({
        className: 'leaflet-custom-icon',
        html: config.html,
        iconSize: config.iconSize,
        iconAnchor: config.iconAnchor,
        popupAnchor: config.popupAnchor
    });
};

// Get sensitivity color
const getSensitivityColor = (sensitivity) => {
    const colors = {
        very_high: '#EF4444',
        high: '#F97316',
        medium: '#F59E0B',
        low: '#22C55E',
        very_low: '#3B82F6'
    };
    return colors[sensitivity] || '#6B7280';
};

// Get compliance status HTML
const getComplianceStatus = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage <= 80) {
        return `<span class="compliance-good">${mapLang === 'de' ? 'Konform' : 'Compliant'}</span>`;
    } else if (percentage <= 100) {
        return `<span class="compliance-warning">${mapLang === 'de' ? 'Grenzwertnah' : 'Near Limit'}</span>`;
    }
    return `<span class="compliance-danger">${mapLang === 'de' ? 'Überschreitung' : 'Exceeded'}</span>`;
};

// Initialize the Leaflet map
async function initLeafletMap() {
    // Check if container exists
    const container = document.getElementById('leaflet-map');
    if (!container) {
        console.error('Leaflet map container not found');
        return;
    }

    // Create map centered on Berlin (Eurofins Lab area)
    leafletMap = L.map('leaflet-map', {
        center: [52.480000, 13.350000],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
    });

    // Add tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    // Terrain layer (OpenTopoMap for 3D-like terrain visualization)
    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
    });

    // Satellite layer (ESRI)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri'
    });

    // Add default layer
    osmLayer.addTo(leafletMap);

    // Layer control
    const baseMaps = {
        "Standard": osmLayer,
        "Terrain": terrainLayer,
        "Satellit": satelliteLayer
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(leafletMap);

    // Add scale control
    L.control.scale({
        metric: true,
        imperial: false,
        position: 'bottomleft'
    }).addTo(leafletMap);

    // Load map data
    await loadMapData();

    // Initialize layers
    initNoiseZones();
    initRoutes();
    initMarkers();
    initHeatmap();

    // Set up event listeners
    setupMapEventListeners();

    console.info('Leaflet map initialized successfully');
}

// Load map data from JSON files
async function loadMapData() {
    try {
        const [routesRes, locationsRes, noiseZonesRes] = await Promise.all([
            fetch('assets/geo/routes.geojson'),
            fetch('assets/geo/locations.json'),
            fetch('assets/geo/noise_zones.json')
        ]);

        mapData.routes = await routesRes.json();
        mapData.locations = await locationsRes.json();
        mapData.noiseZones = await noiseZonesRes.json();

        console.info('Map data loaded:', mapData);
    } catch (error) {
        console.error('Error loading map data:', error);
        // Use fallback data if files not found
        useFallbackData();
    }
}

// Fallback data if JSON files not available
function useFallbackData() {
    mapData.routes = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    id: "route_a",
                    name: "Route A - Optimierte Lärmreduzierung",
                    color: "#EF4444",
                    distance_km: 12.3,
                    duration_min: 8,
                    noise_exposure_db: 48,
                    ta_compliant: true
                },
                geometry: {
                    type: "LineString",
                    coordinates: [[13.3050, 52.4680], [13.3850, 52.5050]]
                }
            }
        ]
    };
}

// Initialize noise zones layer
function initNoiseZones() {
    if (!mapData.noiseZones) return;

    const zonesGroup = L.layerGroup();

    mapData.noiseZones.zones.forEach(zone => {
        if (zone.polygon) {
            const coords = zone.polygon.map(p => [p[1], p[0]]);
            const polygon = L.polygon(coords, {
                color: zone.border_color,
                fillColor: zone.color,
                fillOpacity: 0.4,
                weight: 2
            });

            polygon.bindPopup(createZonePopup(zone));
            zonesGroup.addLayer(polygon);
        }

        // Add circle for radius visualization
        const circle = L.circle([zone.center[1], zone.center[0]], {
            radius: zone.radius_m,
            color: zone.border_color,
            fillColor: zone.color,
            fillOpacity: 0.2,
            weight: 1,
            dashArray: '5, 5'
        });
        zonesGroup.addLayer(circle);
    });

    // No-fly zones
    mapData.noiseZones.no_fly_zones?.forEach(nfz => {
        const circle = L.circle([nfz.center[1], nfz.center[0]], {
            radius: nfz.radius_m,
            color: '#DC2626',
            fillColor: '#FEE2E2',
            fillOpacity: 0.5,
            weight: 3,
            dashArray: '10, 5'
        });
        circle.bindPopup(`
            <div class="zone-popup nfz-popup">
                <h4>${nfz.name}</h4>
                <p class="danger">${mapLang === 'de' ? 'Sperrzone' : 'No-Fly Zone'}</p>
                <p>${nfz.reason}</p>
            </div>
        `);
        zonesGroup.addLayer(circle);
    });

    noiseZoneLayers.zones = zonesGroup;
    zonesGroup.addTo(leafletMap);
}

// Create zone popup content
function createZonePopup(zone) {
    const name = mapLang === 'de' ? zone.name : (zone.name_en || zone.name);
    const typeLabel = mapLang === 'de' ? 'Typ' : 'Type';
    const limitLabel = mapLang === 'de' ? 'Grenzwert Tag/Nacht' : 'Limit Day/Night';
    const currentLabel = mapLang === 'de' ? 'Aktueller Pegel' : 'Current Level';
    const flightsLabel = mapLang === 'de' ? 'Flüge/Stunde' : 'Flights/Hour';

    return `
        <div class="zone-popup">
            <h4>${name}</h4>
            <div class="popup-grid">
                <span class="label">${typeLabel}:</span>
                <span class="value">${zone.type}</span>
                <span class="label">${limitLabel}:</span>
                <span class="value">${zone.ta_limit_day_db}/${zone.ta_limit_night_db} dB(A)</span>
                <span class="label">${currentLabel}:</span>
                <span class="value">${zone.current_avg_db} dB(A) ${getComplianceStatus(zone.current_avg_db, zone.ta_limit_day_db)}</span>
                <span class="label">${flightsLabel}:</span>
                <span class="value">${zone.current_flights_hour}/${zone.max_allowed_flights_hour}</span>
            </div>
        </div>
    `;
}

// Initialize route layers
function initRoutes() {
    if (!mapData.routes || !mapData.routes.features) return;

    mapData.routes.features.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);

        const polyline = L.polyline(coords, {
            color: props.color,
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
        });

        // Hover effect
        polyline.on('mouseover', function() {
            this.setStyle({ weight: 8, opacity: 1 });
        });
        polyline.on('mouseout', function() {
            this.setStyle({ weight: 5, opacity: 0.8 });
        });

        // Click popup
        polyline.bindPopup(createRoutePopup(props));

        routeLayers[props.id] = polyline;
        polyline.addTo(leafletMap);
    });
}

// Create route popup content
function createRoutePopup(props) {
    const name = mapLang === 'de' ? props.name : (props.name_en || props.name);
    const desc = mapLang === 'de' ? props.description : (props.description_en || props.description);

    const labels = mapLang === 'de' ? {
        distance: 'Distanz',
        duration: 'Flugzeit',
        noise: 'Lärmbelastung',
        energy: 'Energieverbrauch',
        status: 'TA-Lärm Status'
    } : {
        distance: 'Distance',
        duration: 'Flight Time',
        noise: 'Noise Exposure',
        energy: 'Energy Use',
        status: 'TA Noise Status'
    };

    const complianceText = props.ta_compliant
        ? (mapLang === 'de' ? '✓ Konform' : '✓ Compliant')
        : (mapLang === 'de' ? '✗ Nicht konform' : '✗ Non-compliant');

    return `
        <div class="route-popup">
            <h4 style="color: ${props.color}">${name}</h4>
            <p class="route-desc">${desc}</p>
            <div class="popup-grid">
                <span class="label">${labels.distance}:</span>
                <span class="value">${props.distance_km} km</span>
                <span class="label">${labels.duration}:</span>
                <span class="value">${props.duration_min} min</span>
                <span class="label">${labels.noise}:</span>
                <span class="value">${props.noise_exposure_db} dB(A)</span>
                <span class="label">${labels.energy}:</span>
                <span class="value">${props.energy_consumption_percent}%</span>
                <span class="label">${labels.status}:</span>
                <span class="value ${props.ta_compliant ? 'compliance-good' : 'compliance-danger'}">${complianceText}</span>
            </div>
        </div>
    `;
}

// Initialize markers
function initMarkers() {
    if (!mapData.locations) return;

    // Start points (Laboratories)
    const startGroup = L.layerGroup();
    mapData.locations.start_points?.forEach(loc => {
        const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
            icon: createCustomIcon('start', loc.color)
        });
        marker.bindPopup(createStartPointPopup(loc));
        startGroup.addLayer(marker);
    });
    markerLayers.start = startGroup;
    startGroup.addTo(leafletMap);

    // Destinations (Hospitals)
    const hospitalGroup = L.layerGroup();
    mapData.locations.destinations?.forEach(loc => {
        const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
            icon: createCustomIcon('hospital', loc.color)
        });
        marker.bindPopup(createHospitalPopup(loc));
        hospitalGroup.addLayer(marker);
    });
    markerLayers.hospitals = hospitalGroup;
    hospitalGroup.addTo(leafletMap);

    // Immissionsorte (Noise measurement points)
    const sensorGroup = L.layerGroup();
    mapData.locations.immissionsorte?.forEach(loc => {
        const color = getSensitivityColor(loc.sensitivity);
        const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
            icon: createCustomIcon('noise_sensor', color)
        });
        marker.bindPopup(createImmissionsortPopup(loc));
        sensorGroup.addLayer(marker);
    });
    markerLayers.sensors = sensorGroup;
    sensorGroup.addTo(leafletMap);
}

// Create start point popup
function createStartPointPopup(loc) {
    const name = mapLang === 'de' ? loc.name : (loc.name_en || loc.name);
    const labels = mapLang === 'de' ? {
        address: 'Adresse',
        hours: 'Betriebszeiten',
        flights: 'Tägliche Flüge',
        capabilities: 'Transportgüter'
    } : {
        address: 'Address',
        hours: 'Operating Hours',
        flights: 'Daily Flights',
        capabilities: 'Transport Goods'
    };

    return `
        <div class="location-popup start-popup">
            <h4>🟢 ${name}</h4>
            <div class="popup-grid">
                <span class="label">${labels.address}:</span>
                <span class="value">${loc.address}</span>
                <span class="label">${labels.hours}:</span>
                <span class="value">${loc.operating_hours}</span>
                <span class="label">${labels.flights}:</span>
                <span class="value">${loc.daily_flights}</span>
                <span class="label">${labels.capabilities}:</span>
                <span class="value">${loc.capabilities.join(', ')}</span>
            </div>
        </div>
    `;
}

// Create hospital popup
function createHospitalPopup(loc) {
    const name = mapLang === 'de' ? loc.name : (loc.name_en || loc.name);
    const labels = mapLang === 'de' ? {
        address: 'Adresse',
        priority: 'Priorität',
        deliveries: 'Tägliche Lieferungen',
        avgTime: 'Durchschn. Lieferzeit'
    } : {
        address: 'Address',
        priority: 'Priority',
        deliveries: 'Daily Deliveries',
        avgTime: 'Avg. Delivery Time'
    };

    const priorityColors = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

    return `
        <div class="location-popup hospital-popup">
            <h4>🏥 ${name}</h4>
            <div class="popup-grid">
                <span class="label">${labels.address}:</span>
                <span class="value">${loc.address}</span>
                <span class="label">${labels.priority}:</span>
                <span class="value" style="color: ${priorityColors[loc.priority]}">${loc.priority.toUpperCase()}</span>
                <span class="label">${labels.deliveries}:</span>
                <span class="value">${loc.daily_deliveries}</span>
                <span class="label">${labels.avgTime}:</span>
                <span class="value">${loc.avg_delivery_time_min} min</span>
            </div>
        </div>
    `;
}

// Create immissionsort popup
function createImmissionsortPopup(loc) {
    const name = mapLang === 'de' ? loc.name : (loc.name_en || loc.name);
    const labels = mapLang === 'de' ? {
        type: 'Typ',
        sensitivity: 'Empfindlichkeit',
        current: 'Aktueller Pegel',
        limit: 'Grenzwert Tag/Nacht',
        distance: 'Distanz zur Route',
        complaints: 'Beschwerden (30 Tage)',
        affected: 'Betroffene Personen'
    } : {
        type: 'Type',
        sensitivity: 'Sensitivity',
        current: 'Current Level',
        limit: 'Limit Day/Night',
        distance: 'Distance to Route',
        complaints: 'Complaints (30 days)',
        affected: 'Affected Population'
    };

    const sensitivityLabels = mapLang === 'de'
        ? { very_high: 'Sehr hoch', high: 'Hoch', medium: 'Mittel', low: 'Niedrig', very_low: 'Sehr niedrig' }
        : { very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low', very_low: 'Very Low' };

    return `
        <div class="location-popup sensor-popup">
            <h4>${name}</h4>
            <div class="popup-grid">
                <span class="label">${labels.type}:</span>
                <span class="value">${loc.type}</span>
                <span class="label">${labels.sensitivity}:</span>
                <span class="value" style="color: ${getSensitivityColor(loc.sensitivity)}">${sensitivityLabels[loc.sensitivity]}</span>
                <span class="label">${labels.current}:</span>
                <span class="value">${loc.current_noise_db} dB(A) ${getComplianceStatus(loc.current_noise_db, loc.ta_limit_day_db)}</span>
                <span class="label">${labels.limit}:</span>
                <span class="value">${loc.ta_limit_day_db}/${loc.ta_limit_night_db} dB(A)</span>
                <span class="label">${labels.distance}:</span>
                <span class="value">${loc.distance_to_route_m} m</span>
                <span class="label">${labels.complaints}:</span>
                <span class="value ${loc.complaints_30d > 2 ? 'text-warning' : ''}">${loc.complaints_30d}</span>
                <span class="label">${labels.affected}:</span>
                <span class="value">${loc.population_affected.toLocaleString()}</span>
            </div>
        </div>
    `;
}

// Initialize heatmap layer
function initHeatmap() {
    if (!mapData.locations || !mapData.locations.immissionsorte) return;

    // Leaflet.heat plugin would be needed for actual heatmap
    // For now, create circle markers as pseudo-heatmap
    const heatGroup = L.layerGroup();

    mapData.locations.immissionsorte.forEach(loc => {
        const intensity = (loc.current_noise_db - 40) / 30;
        const radius = 150 + intensity * 200;

        const circle = L.circle([loc.coordinates[1], loc.coordinates[0]], {
            radius: radius,
            color: 'transparent',
            fillColor: getHeatColor(loc.current_noise_db),
            fillOpacity: 0.3 + intensity * 0.3,
            weight: 0
        });
        heatGroup.addLayer(circle);
    });

    heatmapLayer = heatGroup;
}

// Get heat color based on noise level
function getHeatColor(db) {
    if (db <= 45) return '#22C55E';
    if (db <= 50) return '#84CC16';
    if (db <= 55) return '#F59E0B';
    if (db <= 60) return '#F97316';
    if (db <= 65) return '#EF4444';
    return '#DC2626';
}

// Toggle functions
function toggleLeafletRoute(routeId, visible) {
    const layer = routeLayers[routeId];
    if (!layer) return;

    if (visible) {
        layer.addTo(leafletMap);
    } else {
        leafletMap.removeLayer(layer);
    }
}

function toggleLeafletHeatmap(visible) {
    if (!heatmapLayer) return;

    if (visible) {
        heatmapLayer.addTo(leafletMap);
    } else {
        leafletMap.removeLayer(heatmapLayer);
    }
}

function toggleNoiseZones(visible) {
    if (!noiseZoneLayers.zones) return;

    if (visible) {
        noiseZoneLayers.zones.addTo(leafletMap);
    } else {
        leafletMap.removeLayer(noiseZoneLayers.zones);
    }
}

function toggleMarkerGroup(group, visible) {
    const layer = markerLayers[group];
    if (!layer) return;

    if (visible) {
        layer.addTo(leafletMap);
    } else {
        leafletMap.removeLayer(layer);
    }
}

// Zoom to specific route
function zoomToRoute(routeId) {
    const layer = routeLayers[routeId];
    if (layer) {
        leafletMap.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }
}

// Zoom to all routes
function zoomToAllRoutes() {
    const allCoords = [];
    Object.values(routeLayers).forEach(layer => {
        if (layer.getLatLngs) {
            allCoords.push(...layer.getLatLngs());
        }
    });

    if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        leafletMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Setup map event listeners
function setupMapEventListeners() {
    // Route toggle checkboxes
    document.querySelectorAll('[data-leaflet-route]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleLeafletRoute(this.dataset.leafletRoute, this.checked);
        });
    });

    // Heatmap toggle
    const heatmapToggle = document.getElementById('leafletHeatmapToggle');
    if (heatmapToggle) {
        heatmapToggle.addEventListener('change', function() {
            toggleLeafletHeatmap(this.checked);
        });
    }

    // Noise zones toggle
    const zonesToggle = document.getElementById('noiseZonesToggle');
    if (zonesToggle) {
        zonesToggle.addEventListener('change', function() {
            toggleNoiseZones(this.checked);
        });
    }
}

// Update map language
function updateMapLanguage(lang) {
    mapLang = lang;

    // Refresh popups with new language
    // Routes
    if (mapData.routes) {
        mapData.routes.features.forEach(feature => {
            const layer = routeLayers[feature.properties.id];
            if (layer) {
                layer.setPopupContent(createRoutePopup(feature.properties));
            }
        });
    }

    // Markers would need similar updates
    // This is a simplified version - full implementation would refresh all popups
}

// Export functions for external use
window.initLeafletMap = initLeafletMap;
window.toggleLeafletRoute = toggleLeafletRoute;
window.toggleLeafletHeatmap = toggleLeafletHeatmap;
window.toggleNoiseZones = toggleNoiseZones;
window.toggleMarkerGroup = toggleMarkerGroup;
window.zoomToRoute = zoomToRoute;
window.zoomToAllRoutes = zoomToAllRoutes;
window.updateMapLanguage = updateMapLanguage;
