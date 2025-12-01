// MORPHEUS Dashboard - Chart.js Visualizations
// Handles all chart creation and updates

let noiseComparisonChart;
let taLaermComplianceChart;
let routeComparisonChart;

// Initialize all charts
function initCharts() {
  initNoiseComparisonChart();
  initTALaermComplianceChart();
  initRouteComparisonChart();
}

// Noise Comparison Chart (Historical)
function initNoiseComparisonChart() {
  const ctx = document.getElementById('noiseComparisonChart');
  if (!ctx) return;

  noiseComparisonChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historicalNoiseData.labels,
      datasets: [
        {
          label: routeData.route1.name,
          data: historicalNoiseData.datasets.route1,
          borderColor: routeData.route1.color,
          backgroundColor: routeData.route1.color + '20',
          tension: 0.4,
          fill: true
        },
        {
          label: routeData.route2.name,
          data: historicalNoiseData.datasets.route2,
          borderColor: routeData.route2.color,
          backgroundColor: routeData.route2.color + '20',
          tension: 0.4,
          fill: true
        },
        {
          label: routeData.route3.name,
          data: historicalNoiseData.datasets.route3,
          borderColor: routeData.route3.color,
          backgroundColor: routeData.route3.color + '20',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: currentLang === 'de' ? 'Historische Lärmbelastung (7 Tage)' : 'Historical Noise Exposure (7 Days)'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y + ' dB(A)';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 40,
          max: 70,
          title: {
            display: true,
            text: 'dB(A)'
          }
        }
      }
    }
  });
}

// TA Lärm Compliance Chart
function initTALaermComplianceChart() {
  const ctx = document.getElementById('taLaermChart');
  if (!ctx) return;

  const labels = taLaermData.measurements.map(m => m.time);
  const values = taLaermData.measurements.map(m => m.level);
  const dayLimit = taLaermData.limits.residential.day;
  const nightLimit = taLaermData.limits.residential.night;

  taLaermComplianceChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: currentLang === 'de' ? 'Gemessener Pegel' : 'Measured Level',
          data: values,
          backgroundColor: values.map(v => {
            const hour = parseInt(labels[values.indexOf(v)].split(':')[0]);
            const isNight = hour >= 22 || hour < 6;
            const limit = isNight ? nightLimit : dayLimit;
            return v > limit ? '#EF4444' : '#10B981';
          }),
          borderColor: '#1F2937',
          borderWidth: 1
        },
        {
          label: currentLang === 'de' ? 'Taggrenze (55 dB)' : 'Day Limit (55 dB)',
          data: new Array(labels.length).fill(dayLimit),
          type: 'line',
          borderColor: '#F59E0B',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: currentLang === 'de' ? 'Nachtgrenze (40 dB)' : 'Night Limit (40 dB)',
          data: new Array(labels.length).fill(nightLimit),
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
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: currentLang === 'de' ? 'TA Lärm Compliance (24h)' : 'TA Noise Compliance (24h)'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.dataset.type === 'line') {
                return context.dataset.label;
              }
              return context.dataset.label + ': ' + context.parsed.y + ' dB(A)';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 30,
          max: 70,
          title: {
            display: true,
            text: 'dB(A)'
          }
        }
      }
    }
  });
}

// Route Comparison Chart (Multi-metric)
function initRouteComparisonChart() {
  const ctx = document.getElementById('routeComparisonChart');
  if (!ctx) return;

  const routes = Object.values(routeData);
  
  routeComparisonChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: [
        currentLang === 'de' ? 'Distanz (inv)' : 'Distance (inv)',
        currentLang === 'de' ? 'Zeit (inv)' : 'Time (inv)',
        currentLang === 'de' ? 'Lärmarm' : 'Low Noise',
        currentLang === 'de' ? 'Energieeff.' : 'Energy Eff.',
        currentLang === 'de' ? 'Compliance' : 'Compliance'
      ],
      datasets: routes.map(route => ({
        label: route.name,
        data: [
          100 - (route.distance / 10 * 100), // Inverse distance (shorter is better)
          100 - (route.duration / 25 * 100), // Inverse time (faster is better)
          100 - (route.noiseExposure / 70 * 100), // Inverse noise (quieter is better)
          100 - route.energyConsumption, // Energy efficiency
          route.taCompliance ? 100 : 0 // Compliance
        ],
        backgroundColor: route.color + '30',
        borderColor: route.color,
        pointBackgroundColor: route.color,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: route.color,
        borderWidth: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: currentLang === 'de' ? 'Routen-Vergleich (Mehrere Metriken)' : 'Route Comparison (Multiple Metrics)'
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
          }
        }
      }
    }
  });
}

// Update charts when language changes
function updateChartsLanguage() {
  if (noiseComparisonChart) {
    noiseComparisonChart.options.plugins.title.text = 
      currentLang === 'de' ? 'Historische Lärmbelastung (7 Tage)' : 'Historical Noise Exposure (7 Days)';
    noiseComparisonChart.update();
  }
  
  if (taLaermComplianceChart) {
    taLaermComplianceChart.options.plugins.title.text = 
      currentLang === 'de' ? 'TA Lärm Compliance (24h)' : 'TA Noise Compliance (24h)';
    taLaermComplianceChart.data.datasets[0].label = 
      currentLang === 'de' ? 'Gemessener Pegel' : 'Measured Level';
    taLaermComplianceChart.data.datasets[1].label = 
      currentLang === 'de' ? 'Taggrenze (55 dB)' : 'Day Limit (55 dB)';
    taLaermComplianceChart.data.datasets[2].label = 
      currentLang === 'de' ? 'Nachtgrenze (40 dB)' : 'Night Limit (40 dB)';
    taLaermComplianceChart.update();
  }
  
  if (routeComparisonChart) {
    routeComparisonChart.options.plugins.title.text = 
      currentLang === 'de' ? 'Routen-Vergleich (Mehrere Metriken)' : 'Route Comparison (Multiple Metrics)';
    routeComparisonChart.data.labels = [
      currentLang === 'de' ? 'Distanz (inv)' : 'Distance (inv)',
      currentLang === 'de' ? 'Zeit (inv)' : 'Time (inv)',
      currentLang === 'de' ? 'Lärmarm' : 'Low Noise',
      currentLang === 'de' ? 'Energieeff.' : 'Energy Eff.',
      currentLang === 'de' ? 'Compliance' : 'Compliance'
    ];
    routeComparisonChart.update();
  }
}

// Export functions
if (typeof window !== 'undefined') {
  window.initCharts = initCharts;
  window.updateChartsLanguage = updateChartsLanguage;
}
