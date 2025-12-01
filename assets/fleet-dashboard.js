// MORPHEUS Dashboard - Fleet Status and Operations Module
// Real-time fleet tracking, flight schedule, and performance metrics

// Fleet data storage
let fleetState = {
    drones: [],
    flights: [],
    performance: {},
    lastUpdate: null
};

// Current language
let fleetLang = 'de';

// Drone fleet configuration (5x Auriol drones)
const droneConfig = [
    { id: 'AUR-001', name: 'Auriol Alpha', model: 'Auriol X5', maxPayload: 2.5, maxRange: 25 },
    { id: 'AUR-002', name: 'Auriol Beta', model: 'Auriol X5', maxPayload: 2.5, maxRange: 25 },
    { id: 'AUR-003', name: 'Auriol Gamma', model: 'Auriol X5', maxPayload: 2.5, maxRange: 25 },
    { id: 'AUR-004', name: 'Auriol Delta', model: 'Auriol X5', maxPayload: 2.5, maxRange: 25 },
    { id: 'AUR-005', name: 'Auriol Epsilon', model: 'Auriol X5', maxPayload: 2.5, maxRange: 25 }
];

// Hospital destinations
const destinations = [
    { id: 'charite', name: 'Charité Mitte', shortName: 'CHR' },
    { id: 'vivantes', name: 'Vivantes Neukölln', shortName: 'VIV' },
    { id: 'ukb', name: 'UKB Steglitz', shortName: 'UKB' },
    { id: 'drk', name: 'DRK Westend', shortName: 'DRK' },
    { id: 'helios', name: 'HELIOS Buch', shortName: 'HEL' }
];

// Initialize fleet state with simulated data
function initFleetState() {
    const statuses = ['active', 'active', 'active', 'charging', 'maintenance'];
    const now = new Date();

    fleetState.drones = droneConfig.map((config, index) => {
        const status = statuses[index];
        const battery = status === 'active' ? 45 + Math.floor(Math.random() * 50) :
                        status === 'charging' ? 20 + Math.floor(Math.random() * 40) : 100;

        return {
            ...config,
            status: status,
            battery: battery,
            currentPosition: status === 'active' ? generateRandomPosition() : null,
            destination: status === 'active' ? destinations[Math.floor(Math.random() * destinations.length)] : null,
            eta: status === 'active' ? new Date(now.getTime() + (3 + Math.random() * 7) * 60000) : null,
            maintenanceCountdown: status === 'maintenance' ? 45 : Math.floor(Math.random() * 480) + 120,
            flightsToday: Math.floor(Math.random() * 25) + 10,
            lastMaintenance: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        };
    });

    // Generate flight schedule
    generateFlightSchedule();

    // Calculate performance metrics
    calculatePerformanceMetrics();

    fleetState.lastUpdate = now;
}

// Generate random position near Berlin
function generateRandomPosition() {
    return {
        lat: 52.45 + Math.random() * 0.1,
        lng: 13.30 + Math.random() * 0.15
    };
}

// Generate flight schedule for next hours
function generateFlightSchedule() {
    const now = new Date();
    fleetState.flights = [];

    // Generate flights for next 5 slots
    for (let i = 0; i < 8; i++) {
        const flightTime = new Date(now.getTime() + i * 15 * 60000); // Every 15 minutes
        const dest = destinations[i % destinations.length];
        const drone = droneConfig[i % droneConfig.length];
        const duration = 5 + Math.floor(Math.random() * 6); // 5-10 min

        fleetState.flights.push({
            id: `FLT-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}-${i + 1}`,
            droneId: drone.id,
            droneName: drone.name,
            origin: 'Eurofins Labor',
            destination: dest.name,
            destinationShort: dest.shortName,
            scheduledDeparture: flightTime,
            estimatedArrival: new Date(flightTime.getTime() + duration * 60000),
            duration: duration,
            status: i === 0 ? 'in_progress' : (i < 3 ? 'ready' : 'scheduled'),
            cargo: generateCargoType(),
            priority: i < 2 ? 'high' : (i < 5 ? 'medium' : 'low'),
            weatherWarning: Math.random() > 0.85 ? 'wind' : null
        });
    }
}

// Generate random cargo type
function generateCargoType() {
    const types = ['Blutproben', 'Gewebeproben', 'Medikamente', 'Laborergebnisse', 'Notfallmedikation'];
    return types[Math.floor(Math.random() * types.length)];
}

// Calculate performance metrics
function calculatePerformanceMetrics() {
    const activeDrones = fleetState.drones.filter(d => d.status === 'active').length;
    const totalFlightsToday = fleetState.drones.reduce((sum, d) => sum + d.flightsToday, 0);

    fleetState.performance = {
        dailyTarget: 110,
        actualFlights: totalFlightsToday,
        targetProgress: Math.round((totalFlightsToday / 110) * 100),
        avgFlightTime: 7, // minutes
        avgTimeSavings: 35, // minutes vs car
        dailyKilometers: 930,
        actualKilometers: Math.round(930 * (totalFlightsToday / 110)),
        onTimeRate: 94 + Math.floor(Math.random() * 5),
        batteryEfficiency: 88 + Math.floor(Math.random() * 10),
        activeDrones: activeDrones,
        totalDrones: droneConfig.length
    };
}

// Render fleet tracker widget
function renderFleetTracker() {
    const container = document.getElementById('fleet-tracker');
    if (!container) return;

    const labels = fleetLang === 'de' ? {
        title: 'Live Flottentracker',
        battery: 'Batterie',
        status: 'Status',
        destination: 'Ziel',
        eta: 'ETA',
        maintenance: 'Wartung in',
        active: 'Aktiv',
        charging: 'Laden',
        maintenanceStatus: 'Wartung',
        hours: 'Std',
        min: 'Min'
    } : {
        title: 'Live Fleet Tracker',
        battery: 'Battery',
        status: 'Status',
        destination: 'Destination',
        eta: 'ETA',
        maintenance: 'Maintenance in',
        active: 'Active',
        charging: 'Charging',
        maintenanceStatus: 'Maintenance',
        hours: 'hrs',
        min: 'min'
    };

    let html = `
        <div class="fleet-tracker-header">
            <h3>${labels.title}</h3>
            <span class="live-indicator">
                <span class="pulse"></span>
                LIVE
            </span>
        </div>
        <div class="drone-cards">
    `;

    fleetState.drones.forEach(drone => {
        const statusClass = drone.status === 'active' ? 'status-active' :
                           drone.status === 'charging' ? 'status-charging' : 'status-maintenance';
        const statusLabel = drone.status === 'active' ? labels.active :
                           drone.status === 'charging' ? labels.charging : labels.maintenanceStatus;

        const batteryClass = drone.battery > 70 ? 'battery-high' :
                            drone.battery > 30 ? 'battery-medium' : 'battery-low';

        const maintenanceHours = Math.floor(drone.maintenanceCountdown / 60);
        const maintenanceMin = drone.maintenanceCountdown % 60;

        html += `
            <div class="drone-card ${statusClass}">
                <div class="drone-header">
                    <span class="drone-id">${drone.id}</span>
                    <span class="drone-status ${statusClass}">${statusLabel}</span>
                </div>
                <div class="drone-name">${drone.name}</div>
                <div class="drone-metrics">
                    <div class="metric">
                        <span class="metric-icon">🔋</span>
                        <div class="battery-bar">
                            <div class="battery-fill ${batteryClass}" style="width: ${drone.battery}%"></div>
                        </div>
                        <span class="battery-value">${drone.battery}%</span>
                    </div>
                    ${drone.destination ? `
                    <div class="metric">
                        <span class="metric-icon">📍</span>
                        <span class="metric-value">${drone.destination.shortName}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-icon">⏱️</span>
                        <span class="metric-value">${formatETA(drone.eta)}</span>
                    </div>
                    ` : ''}
                    <div class="metric maintenance-countdown">
                        <span class="metric-icon">🔧</span>
                        <span class="metric-label">${labels.maintenance}</span>
                        <span class="metric-value">${maintenanceHours}${labels.hours} ${maintenanceMin}${labels.min}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Format ETA
function formatETA(date) {
    if (!date) return '--:--';
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

// Render flight schedule table
function renderFlightSchedule() {
    const container = document.getElementById('flight-schedule');
    if (!container) return;

    const labels = fleetLang === 'de' ? {
        title: 'Flugplan',
        nextFlights: 'Nächste 5 Flüge',
        flightId: 'Flug-ID',
        drone: 'Drohne',
        destination: 'Ziel',
        departure: 'Abflug',
        eta: 'ETA',
        status: 'Status',
        cargo: 'Fracht',
        inProgress: 'Im Flug',
        ready: 'Bereit',
        scheduled: 'Geplant',
        delayed: 'Verspätet'
    } : {
        title: 'Flight Schedule',
        nextFlights: 'Next 5 Flights',
        flightId: 'Flight ID',
        drone: 'Drone',
        destination: 'Destination',
        departure: 'Departure',
        eta: 'ETA',
        status: 'Status',
        cargo: 'Cargo',
        inProgress: 'In Flight',
        ready: 'Ready',
        scheduled: 'Scheduled',
        delayed: 'Delayed'
    };

    const statusLabels = {
        in_progress: labels.inProgress,
        ready: labels.ready,
        scheduled: labels.scheduled,
        delayed: labels.delayed
    };

    let html = `
        <div class="schedule-header">
            <h3>${labels.title}</h3>
            <span class="schedule-subtitle">${labels.nextFlights}</span>
        </div>
        <div class="schedule-table-wrapper">
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>${labels.flightId}</th>
                        <th>${labels.drone}</th>
                        <th>${labels.destination}</th>
                        <th>${labels.departure}</th>
                        <th>${labels.eta}</th>
                        <th>${labels.status}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    fleetState.flights.slice(0, 5).forEach(flight => {
        const statusClass = `status-${flight.status.replace('_', '-')}`;
        const priorityClass = `priority-${flight.priority}`;

        html += `
            <tr class="${priorityClass}">
                <td class="flight-id">${flight.id}</td>
                <td>${flight.droneId}</td>
                <td>
                    ${flight.destinationShort}
                    ${flight.weatherWarning ? '<span class="weather-warning" title="Windwarnung">⚠️</span>' : ''}
                </td>
                <td>${formatETA(flight.scheduledDeparture)}</td>
                <td>${formatETA(flight.estimatedArrival)}</td>
                <td><span class="flight-status ${statusClass}">${statusLabels[flight.status]}</span></td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

// Render performance metrics
function renderPerformanceMetrics() {
    const container = document.getElementById('performance-metrics');
    if (!container) return;

    const perf = fleetState.performance;
    const labels = fleetLang === 'de' ? {
        title: 'Performance Metriken',
        dailyFlights: 'Tägliche Flüge',
        target: 'Ziel',
        avgFlightTime: 'Durchschn. Flugzeit',
        timeSavings: 'Zeitersparnis vs. Auto',
        dailyKm: 'Tägliche Flugkilometer',
        onTime: 'Pünktlichkeitsrate',
        batteryEff: 'Batterieeffizienz',
        minutes: 'Min',
        km: 'km'
    } : {
        title: 'Performance Metrics',
        dailyFlights: 'Daily Flights',
        target: 'Target',
        avgFlightTime: 'Avg. Flight Time',
        timeSavings: 'Time Savings vs. Car',
        dailyKm: 'Daily Flight Kilometers',
        onTime: 'On-Time Rate',
        batteryEff: 'Battery Efficiency',
        minutes: 'min',
        km: 'km'
    };

    html = `
        <div class="performance-header">
            <h3>${labels.title}</h3>
        </div>
        <div class="performance-grid">
            <div class="perf-card primary">
                <div class="perf-value">${perf.actualFlights}/${perf.dailyTarget}</div>
                <div class="perf-label">${labels.dailyFlights}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${perf.targetProgress}%"></div>
                </div>
                <div class="perf-note">${perf.targetProgress}% ${labels.target}</div>
            </div>
            <div class="perf-card">
                <div class="perf-icon">⏱️</div>
                <div class="perf-value">${perf.avgFlightTime} ${labels.minutes}</div>
                <div class="perf-label">${labels.avgFlightTime}</div>
            </div>
            <div class="perf-card highlight">
                <div class="perf-icon">🚗➡️🚁</div>
                <div class="perf-value">-${perf.avgTimeSavings} ${labels.minutes}</div>
                <div class="perf-label">${labels.timeSavings}</div>
            </div>
            <div class="perf-card">
                <div class="perf-icon">📏</div>
                <div class="perf-value">${perf.actualKilometers} ${labels.km}</div>
                <div class="perf-label">${labels.dailyKm}</div>
            </div>
            <div class="perf-card">
                <div class="perf-icon">✅</div>
                <div class="perf-value">${perf.onTimeRate}%</div>
                <div class="perf-label">${labels.onTime}</div>
            </div>
            <div class="perf-card">
                <div class="perf-icon">🔋</div>
                <div class="perf-value">${perf.batteryEfficiency}%</div>
                <div class="perf-label">${labels.batteryEff}</div>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// Render daily flights chart
function renderFlightsChart() {
    const ctx = document.getElementById('flightsChart');
    if (!ctx) return;

    const labels = fleetLang === 'de'
        ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const targetLabel = fleetLang === 'de' ? 'Ziel (110)' : 'Target (110)';
    const actualLabel = fleetLang === 'de' ? 'Tatsächlich' : 'Actual';

    // Simulated weekly data
    const actualData = [98, 105, 112, 108, 115, 85, 72];
    const targetData = [110, 110, 110, 110, 110, 110, 110];

    if (window.flightsChartInstance) {
        window.flightsChartInstance.destroy();
    }

    window.flightsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: actualLabel,
                    data: actualData,
                    backgroundColor: actualData.map(v => v >= 110 ? '#22C55E' : '#F59E0B'),
                    borderRadius: 4
                },
                {
                    label: targetLabel,
                    data: targetData,
                    type: 'line',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 130,
                    title: {
                        display: true,
                        text: fleetLang === 'de' ? 'Flüge' : 'Flights'
                    }
                }
            }
        }
    });
}

// Update fleet data (simulated real-time updates)
function updateFleetData() {
    const now = new Date();

    // Update drone positions and batteries
    fleetState.drones.forEach(drone => {
        if (drone.status === 'active') {
            // Decrease battery
            drone.battery = Math.max(10, drone.battery - Math.random() * 2);

            // Update position
            if (drone.currentPosition) {
                drone.currentPosition.lat += (Math.random() - 0.5) * 0.005;
                drone.currentPosition.lng += (Math.random() - 0.5) * 0.005;
            }

            // Check if arrived
            if (drone.eta && now > drone.eta) {
                drone.flightsToday++;
                drone.destination = destinations[Math.floor(Math.random() * destinations.length)];
                drone.eta = new Date(now.getTime() + (5 + Math.random() * 5) * 60000);
                drone.battery = 85 + Math.floor(Math.random() * 15);
            }
        } else if (drone.status === 'charging') {
            // Increase battery
            drone.battery = Math.min(100, drone.battery + Math.random() * 3);

            // Check if fully charged
            if (drone.battery >= 95) {
                drone.status = 'active';
                drone.destination = destinations[Math.floor(Math.random() * destinations.length)];
                drone.currentPosition = generateRandomPosition();
                drone.eta = new Date(now.getTime() + (5 + Math.random() * 5) * 60000);
            }
        }

        // Update maintenance countdown
        if (drone.maintenanceCountdown > 0) {
            drone.maintenanceCountdown = Math.max(0, drone.maintenanceCountdown - 1);
        }
    });

    // Update flight schedule
    fleetState.flights.forEach((flight, index) => {
        if (flight.status === 'in_progress' && now > flight.estimatedArrival) {
            flight.status = 'completed';
        } else if (flight.status === 'ready' && now > flight.scheduledDeparture) {
            flight.status = 'in_progress';
        } else if (flight.status === 'scheduled' && now > new Date(flight.scheduledDeparture.getTime() - 5 * 60000)) {
            flight.status = 'ready';
        }
    });

    // Recalculate performance
    calculatePerformanceMetrics();

    fleetState.lastUpdate = now;
}

// Refresh all fleet displays
function refreshFleetDisplay() {
    renderFleetTracker();
    renderFlightSchedule();
    renderPerformanceMetrics();
}

// Initialize fleet dashboard
function initFleetDashboard() {
    initFleetState();
    refreshFleetDisplay();
    renderFlightsChart();

    // Set up real-time update interval (every 5 seconds)
    setInterval(() => {
        updateFleetData();
        refreshFleetDisplay();
    }, 5000);

    console.log('Fleet dashboard initialized');
}

// Update fleet language
function updateFleetLanguage(lang) {
    fleetLang = lang;
    refreshFleetDisplay();
    renderFlightsChart();
}

// Export functions
window.initFleetDashboard = initFleetDashboard;
window.updateFleetLanguage = updateFleetLanguage;
window.refreshFleetDisplay = refreshFleetDisplay;
