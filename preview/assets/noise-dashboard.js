// MORPHEUS Dashboard - Noise Protection Monitoring Module (TA-Lärm)
// Comprehensive noise compliance tracking and threshold monitoring

// Noise monitoring state
let noiseState = {
    immissionsorte: [],
    measurements: [],
    alerts: [],
    dailyStats: {},
    lastUpdate: null
};

// Current language
let noiseLang = 'de';

// TA-Lärm limits reference
const taLaermLimits = {
    residential: { day: 55, night: 40, name_de: 'Wohngebiet', name_en: 'Residential' },
    mixed: { day: 60, night: 45, name_de: 'Mischgebiet', name_en: 'Mixed Use' },
    commercial: { day: 65, night: 50, name_de: 'Gewerbegebiet', name_en: 'Commercial' },
    industrial: { day: 70, night: 70, name_de: 'Industriegebiet', name_en: 'Industrial' },
    hospital: { day: 50, night: 35, name_de: 'Krankenhaus', name_en: 'Hospital' },
    school: { day: 50, night: 35, name_de: 'Schule', name_en: 'School' },
    care_facility: { day: 50, night: 35, name_de: 'Pflegeeinrichtung', name_en: 'Care Facility' },
    recreation: { day: 55, night: 40, name_de: 'Erholungsgebiet', name_en: 'Recreation' },
    hospital_area: { day: 50, night: 35, name_de: 'Klinikumgebung', name_en: 'Hospital Area' }
};

// Initialize noise monitoring state
function initNoiseState() {
    // 10 critical measurement points
    noiseState.immissionsorte = [
        {
            id: 'io_001',
            name_de: 'Wohngebiet Friedenau',
            name_en: 'Residential Friedenau',
            type: 'residential',
            currentLevel: 52,
            peakLevel: 58,
            avgLevel24h: 49,
            limit: taLaermLimits.residential,
            coordinates: [52.4650, 13.3350],
            distanceToRoute: 85,
            flightsPerHour: 5,
            complaintsLast30d: 0,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_002',
            name_de: 'Schule Am Park',
            name_en: 'School Am Park',
            type: 'school',
            currentLevel: 48,
            peakLevel: 54,
            avgLevel24h: 45,
            limit: taLaermLimits.school,
            coordinates: [52.4720, 13.3280],
            distanceToRoute: 120,
            flightsPerHour: 4,
            complaintsLast30d: 1,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_003',
            name_de: 'Seniorenheim Lichterfelde',
            name_en: 'Care Home Lichterfelde',
            type: 'care_facility',
            currentLevel: 45,
            peakLevel: 51,
            avgLevel24h: 42,
            limit: taLaermLimits.care_facility,
            coordinates: [52.4580, 13.3120],
            distanceToRoute: 200,
            flightsPerHour: 3,
            complaintsLast30d: 0,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_004',
            name_de: 'Mischgebiet Steglitz',
            name_en: 'Mixed Area Steglitz',
            type: 'mixed',
            currentLevel: 58,
            peakLevel: 63,
            avgLevel24h: 55,
            limit: taLaermLimits.mixed,
            coordinates: [52.4550, 13.3420],
            distanceToRoute: 45,
            flightsPerHour: 8,
            complaintsLast30d: 2,
            lastMeasurement: new Date(),
            status: 'warning'
        },
        {
            id: 'io_005',
            name_de: 'Gewerbegebiet Tempelhof',
            name_en: 'Commercial Tempelhof',
            type: 'commercial',
            currentLevel: 62,
            peakLevel: 68,
            avgLevel24h: 59,
            limit: taLaermLimits.commercial,
            coordinates: [52.4720, 13.3680],
            distanceToRoute: 30,
            flightsPerHour: 12,
            complaintsLast30d: 0,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_006',
            name_de: 'Wohngebiet Mariendorf',
            name_en: 'Residential Mariendorf',
            type: 'residential',
            currentLevel: 54,
            peakLevel: 59,
            avgLevel24h: 51,
            limit: taLaermLimits.residential,
            coordinates: [52.4580, 13.3850],
            distanceToRoute: 95,
            flightsPerHour: 6,
            complaintsLast30d: 3,
            lastMeasurement: new Date(),
            status: 'warning'
        },
        {
            id: 'io_007',
            name_de: 'Charité Umgebung',
            name_en: 'Charité Surroundings',
            type: 'hospital_area',
            currentLevel: 46,
            peakLevel: 52,
            avgLevel24h: 43,
            limit: taLaermLimits.hospital_area,
            coordinates: [52.5200, 13.3750],
            distanceToRoute: 150,
            flightsPerHour: 4,
            complaintsLast30d: 0,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_008',
            name_de: 'Park Gleisdreieck',
            name_en: 'Gleisdreieck Park',
            type: 'recreation',
            currentLevel: 51,
            peakLevel: 56,
            avgLevel24h: 48,
            limit: taLaermLimits.recreation,
            coordinates: [52.4920, 13.3680],
            distanceToRoute: 75,
            flightsPerHour: 7,
            complaintsLast30d: 1,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_009',
            name_de: 'Industriegebiet Schöneberg',
            name_en: 'Industrial Schöneberg',
            type: 'industrial',
            currentLevel: 68,
            peakLevel: 74,
            avgLevel24h: 65,
            limit: taLaermLimits.industrial,
            coordinates: [52.4850, 13.3520],
            distanceToRoute: 20,
            flightsPerHour: 15,
            complaintsLast30d: 0,
            lastMeasurement: new Date(),
            status: 'compliant'
        },
        {
            id: 'io_010',
            name_de: 'Wohngebiet Kreuzberg',
            name_en: 'Residential Kreuzberg',
            type: 'residential',
            currentLevel: 55,
            peakLevel: 61,
            avgLevel24h: 52,
            limit: taLaermLimits.residential,
            coordinates: [52.4980, 13.4050],
            distanceToRoute: 65,
            flightsPerHour: 8,
            complaintsLast30d: 5,
            lastMeasurement: new Date(),
            status: 'critical'
        }
    ];

    // Generate 24h measurements
    generateDailyMeasurements();

    // Calculate daily stats
    calculateDailyStats();

    noiseState.lastUpdate = new Date();
}

// Generate 24-hour measurement data
function generateDailyMeasurements() {
    noiseState.measurements = [];
    const now = new Date();

    for (let hour = 0; hour < 24; hour++) {
        const isNight = hour >= 22 || hour < 6;
        const baseLevel = isNight ? 38 : 52;
        const variation = isNight ? 5 : 10;

        noiseState.measurements.push({
            hour: `${String(hour).padStart(2, '0')}:00`,
            avgLevel: baseLevel + Math.floor(Math.random() * variation),
            peakLevel: baseLevel + variation + Math.floor(Math.random() * 5),
            limit: isNight ? 40 : 55,
            isNight: isNight,
            timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour)
        });
    }
}

// Calculate daily statistics
function calculateDailyStats() {
    const compliant = noiseState.immissionsorte.filter(io => io.status === 'compliant').length;
    const warning = noiseState.immissionsorte.filter(io => io.status === 'warning').length;
    const critical = noiseState.immissionsorte.filter(io => io.status === 'critical').length;

    const totalComplaints = noiseState.immissionsorte.reduce((sum, io) => sum + io.complaintsLast30d, 0);
    const avgLevel = Math.round(noiseState.immissionsorte.reduce((sum, io) => sum + io.currentLevel, 0) / noiseState.immissionsorte.length);

    noiseState.dailyStats = {
        totalPoints: noiseState.immissionsorte.length,
        compliant: compliant,
        warning: warning,
        critical: critical,
        complianceRate: Math.round((compliant / noiseState.immissionsorte.length) * 100),
        totalComplaints: totalComplaints,
        avgNoiseLevel: avgLevel,
        peakHour: '14:00',
        quietHour: '03:00'
    };
}

// Render immissionsort matrix table
function renderImmissionsortMatrix() {
    const container = document.getElementById('immissionsort-matrix');
    if (!container) return;

    const labels = noiseLang === 'de' ? {
        title: 'Immissionsorte Matrix',
        subtitle: '10 kritische Messpunkte',
        name: 'Standort',
        type: 'Typ',
        current: 'Aktuell',
        peak: 'Spitze',
        avg24h: '24h Ø',
        limitDay: 'Limit Tag',
        limitNight: 'Limit Nacht',
        distance: 'Distanz',
        status: 'Status',
        compliant: 'Konform',
        warning: 'Warnung',
        critical: 'Kritisch',
        complaints: 'Beschwerden'
    } : {
        title: 'Emission Points Matrix',
        subtitle: '10 Critical Measurement Points',
        name: 'Location',
        type: 'Type',
        current: 'Current',
        peak: 'Peak',
        avg24h: '24h Avg',
        limitDay: 'Day Limit',
        limitNight: 'Night Limit',
        distance: 'Distance',
        status: 'Status',
        compliant: 'Compliant',
        warning: 'Warning',
        critical: 'Critical',
        complaints: 'Complaints'
    };

    const statusLabels = {
        compliant: labels.compliant,
        warning: labels.warning,
        critical: labels.critical
    };

    let html = `
        <div class="matrix-header">
            <h3>${labels.title}</h3>
            <span class="matrix-subtitle">${labels.subtitle}</span>
        </div>
        <div class="matrix-table-wrapper">
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>${labels.name}</th>
                        <th>${labels.type}</th>
                        <th>${labels.current}</th>
                        <th>${labels.peak}</th>
                        <th>${labels.avg24h}</th>
                        <th>${labels.limitDay}/${labels.limitNight}</th>
                        <th>${labels.distance}</th>
                        <th>${labels.complaints}</th>
                        <th>${labels.status}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    noiseState.immissionsorte.forEach(io => {
        const name = noiseLang === 'de' ? io.name_de : io.name_en;
        const typeName = noiseLang === 'de' ? io.limit.name_de : io.limit.name_en;
        const utilizationDay = Math.round((io.currentLevel / io.limit.day) * 100);
        const levelClass = utilizationDay >= 100 ? 'level-danger' :
                          utilizationDay >= 90 ? 'level-warning' : 'level-ok';

        html += `
            <tr class="status-${io.status}">
                <td class="io-name">${name}</td>
                <td><span class="type-badge type-${io.type}">${typeName}</span></td>
                <td class="${levelClass}">
                    <span class="level-value">${io.currentLevel}</span>
                    <span class="level-unit">dB</span>
                    <span class="utilization">(${utilizationDay}%)</span>
                </td>
                <td>${io.peakLevel} dB</td>
                <td>${io.avgLevel24h} dB</td>
                <td>${io.limit.day}/${io.limit.night} dB</td>
                <td>${io.distanceToRoute} m</td>
                <td class="${io.complaintsLast30d > 2 ? 'complaints-high' : ''}">${io.complaintsLast30d}</td>
                <td>
                    <span class="status-badge status-${io.status}">${statusLabels[io.status]}</span>
                </td>
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

// Render noise statistics cards
function renderNoiseStats() {
    const container = document.getElementById('noise-stats');
    if (!container) return;

    const stats = noiseState.dailyStats;
    const labels = noiseLang === 'de' ? {
        complianceRate: 'Konformitätsrate',
        avgNoise: 'Durchschn. Pegel',
        complaints: 'Beschwerden (30 Tage)',
        criticalPoints: 'Kritische Punkte',
        peakHour: 'Spitzenzeit',
        quietHour: 'Ruhigste Zeit'
    } : {
        complianceRate: 'Compliance Rate',
        avgNoise: 'Avg. Noise Level',
        complaints: 'Complaints (30 days)',
        criticalPoints: 'Critical Points',
        peakHour: 'Peak Hour',
        quietHour: 'Quietest Hour'
    };

    const html = `
        <div class="noise-stats-grid">
            <div class="stat-card ${stats.complianceRate >= 90 ? 'stat-good' : 'stat-warning'}">
                <div class="stat-value">${stats.complianceRate}%</div>
                <div class="stat-label">${labels.complianceRate}</div>
                <div class="stat-detail">${stats.compliant}/${stats.totalPoints}</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.avgNoiseLevel} dB</div>
                <div class="stat-label">${labels.avgNoise}</div>
            </div>
            <div class="stat-card ${stats.totalComplaints > 5 ? 'stat-warning' : ''}">
                <div class="stat-value">${stats.totalComplaints}</div>
                <div class="stat-label">${labels.complaints}</div>
            </div>
            <div class="stat-card ${stats.critical > 0 ? 'stat-danger' : ''}">
                <div class="stat-value">${stats.critical}</div>
                <div class="stat-label">${labels.criticalPoints}</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.peakHour}</div>
                <div class="stat-label">${labels.peakHour}</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.quietHour}</div>
                <div class="stat-label">${labels.quietHour}</div>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// Render 24-hour noise chart
function render24HourNoiseChart() {
    const ctx = document.getElementById('noise24hChart');
    if (!ctx) return;

    const dayLabel = noiseLang === 'de' ? 'Taggrenzwert (55 dB)' : 'Day Limit (55 dB)';
    const nightLabel = noiseLang === 'de' ? 'Nachtgrenzwert (40 dB)' : 'Night Limit (40 dB)';
    const avgLabel = noiseLang === 'de' ? 'Durchschnitt' : 'Average';
    const peakLabel = noiseLang === 'de' ? 'Spitzenwert' : 'Peak';

    if (window.noise24hChartInstance) {
        window.noise24hChartInstance.destroy();
    }

    const hours = noiseState.measurements.map(m => m.hour);
    const avgLevels = noiseState.measurements.map(m => m.avgLevel);
    const peakLevels = noiseState.measurements.map(m => m.peakLevel);
    const limits = noiseState.measurements.map(m => m.limit);

    window.noise24hChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [
                {
                    label: avgLabel,
                    data: avgLevels,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: peakLabel,
                    data: peakLevels,
                    borderColor: '#F97316',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                },
                {
                    label: dayLabel + ' / ' + nightLabel,
                    data: limits,
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    fill: false,
                    stepped: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                annotation: {
                    annotations: {
                        nightZone1: {
                            type: 'box',
                            xMin: 0,
                            xMax: 5,
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderWidth: 0
                        },
                        nightZone2: {
                            type: 'box',
                            xMin: 22,
                            xMax: 23,
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderWidth: 0
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 30,
                    max: 70,
                    title: {
                        display: true,
                        text: 'dB(A)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: noiseLang === 'de' ? 'Uhrzeit' : 'Time'
                    }
                }
            }
        }
    });
}

// Render TA-Lärm limits reference
function renderTaLaermReference() {
    const container = document.getElementById('ta-laerm-reference');
    if (!container) return;

    const labels = noiseLang === 'de' ? {
        title: 'TA-Lärm Grenzwerte',
        zone: 'Gebietstyp',
        dayLimit: 'Tag (06-22 Uhr)',
        nightLimit: 'Nacht (22-06 Uhr)',
        peakAllowance: 'Spitzenzuschlag'
    } : {
        title: 'TA Noise Limits',
        zone: 'Zone Type',
        dayLimit: 'Day (06-22)',
        nightLimit: 'Night (22-06)',
        peakAllowance: 'Peak Allowance'
    };

    let html = `
        <div class="reference-header">
            <h4>${labels.title}</h4>
        </div>
        <table class="reference-table">
            <thead>
                <tr>
                    <th>${labels.zone}</th>
                    <th>${labels.dayLimit}</th>
                    <th>${labels.nightLimit}</th>
                    <th>${labels.peakAllowance}</th>
                </tr>
            </thead>
            <tbody>
    `;

    const zones = ['residential', 'mixed', 'commercial', 'industrial', 'hospital'];
    zones.forEach(zone => {
        const limit = taLaermLimits[zone];
        const name = noiseLang === 'de' ? limit.name_de : limit.name_en;
        const peakAllowance = zone === 'industrial' ? '+15 dB' : '+10 dB';

        html += `
            <tr>
                <td>${name}</td>
                <td>${limit.day} dB(A)</td>
                <td>${limit.night} dB(A)</td>
                <td>${peakAllowance}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

// Update noise data (simulated real-time updates)
function updateNoiseData() {
    const now = new Date();

    noiseState.immissionsorte.forEach(io => {
        // Simulate noise level fluctuation
        const variation = (Math.random() - 0.5) * 4;
        io.currentLevel = Math.max(35, Math.min(75, io.currentLevel + variation));

        // Update peak if current exceeds
        if (io.currentLevel > io.peakLevel) {
            io.peakLevel = Math.round(io.currentLevel);
        }

        // Update status based on current level
        const utilization = io.currentLevel / io.limit.day;
        if (utilization >= 1.0) {
            io.status = 'critical';
        } else if (utilization >= 0.9) {
            io.status = 'warning';
        } else {
            io.status = 'compliant';
        }

        io.lastMeasurement = now;
    });

    calculateDailyStats();
    noiseState.lastUpdate = now;
}

// Refresh all noise displays
function refreshNoiseDisplay() {
    renderImmissionsortMatrix();
    renderNoiseStats();
}

// Initialize noise dashboard
function initNoiseDashboard() {
    initNoiseState();
    refreshNoiseDisplay();
    render24HourNoiseChart();
    renderTaLaermReference();

    // Set up real-time update interval (every 3 seconds)
    setInterval(() => {
        updateNoiseData();
        refreshNoiseDisplay();
    }, 3000);

    console.info('Noise dashboard initialized');
}

// Update noise language
function updateNoiseLanguage(lang) {
    noiseLang = lang;
    refreshNoiseDisplay();
    render24HourNoiseChart();
    renderTaLaermReference();
}

// Export functions
window.initNoiseDashboard = initNoiseDashboard;
window.updateNoiseLanguage = updateNoiseLanguage;
window.refreshNoiseDisplay = refreshNoiseDisplay;
