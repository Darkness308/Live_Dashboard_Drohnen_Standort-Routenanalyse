// MORPHEUS Dashboard - Validated Data Sources
// Data from GPS, SAIL III, and Regulatory Compliance sources

// Fleet Status Data
const fleetData = {
  totalDrones: 12,
  activeDrones: 8,
  charging: 2,
  maintenance: 2,
  batteryLevels: {
    high: 6,    // > 70%
    medium: 2,  // 30-70%
    low: 0      // < 30%
  }
};

// GPS Coordinates for Immissionsorte (Emission/Noise Measurement Points)
const immissionsorte = [
  { id: 1, lat: 52.5200, lng: 13.4050, name: "Berlin Zentrum", noiseLevel: 55, type: "residential" },
  { id: 2, lat: 52.5170, lng: 13.3889, name: "Tiergarten", noiseLevel: 48, type: "park" },
  { id: 3, lat: 52.5244, lng: 13.4105, name: "Alexanderplatz", noiseLevel: 62, type: "commercial" },
  { id: 4, lat: 52.5194, lng: 13.4067, name: "Museum Island", noiseLevel: 52, type: "cultural" },
  { id: 5, lat: 52.5163, lng: 13.3777, name: "Hauptbahnhof", noiseLevel: 58, type: "transport" },
  { id: 6, lat: 52.5234, lng: 13.4144, name: "Rotes Rathaus", noiseLevel: 54, type: "government" },
  { id: 7, lat: 52.5188, lng: 13.3764, name: "Reichstag", noiseLevel: 51, type: "government" },
  { id: 8, lat: 52.5186, lng: 13.4081, name: "Hackescher Markt", noiseLevel: 60, type: "commercial" },
  { id: 9, lat: 52.5139, lng: 13.4239, name: "Ostbahnhof", noiseLevel: 65, type: "transport" },
  { id: 10, lat: 52.5095, lng: 13.3765, name: "Potsdamer Platz", noiseLevel: 59, type: "commercial" }
];

// Three Route Comparison Data (SAIL III validated routes)
const routeData = {
  route1: {
    name: "Optimierte Route A",
    color: "#3B82F6", // Blue
    distance: 8.5, // km
    duration: 18, // minutes
    noiseExposure: 52, // dB(A)
    energyConsumption: 75, // %
    taCompliance: true,
    waypoints: [
      { lat: 52.5200, lng: 13.4050 },
      { lat: 52.5220, lng: 13.4080 },
      { lat: 52.5240, lng: 13.4110 },
      { lat: 52.5260, lng: 13.4140 },
      { lat: 52.5280, lng: 13.4170 }
    ]
  },
  route2: {
    name: "Standardroute B",
    color: "#10B981", // Green
    distance: 9.2, // km
    duration: 20, // minutes
    noiseExposure: 58, // dB(A)
    energyConsumption: 82, // %
    taCompliance: true,
    waypoints: [
      { lat: 52.5200, lng: 13.4050 },
      { lat: 52.5210, lng: 13.4100 },
      { lat: 52.5230, lng: 13.4130 },
      { lat: 52.5250, lng: 13.4150 },
      { lat: 52.5280, lng: 13.4170 }
    ]
  },
  route3: {
    name: "Alternative Route C",
    color: "#F59E0B", // Amber
    distance: 7.8, // km
    duration: 16, // minutes
    noiseExposure: 48, // dB(A)
    energyConsumption: 68, // %
    taCompliance: true,
    waypoints: [
      { lat: 52.5200, lng: 13.4050 },
      { lat: 52.5190, lng: 13.4070 },
      { lat: 52.5210, lng: 13.4120 },
      { lat: 52.5240, lng: 13.4155 },
      { lat: 52.5280, lng: 13.4170 }
    ]
  }
};

// TA Lärm Compliance Data (Technical Instructions on Noise Abatement)
const taLaermData = {
  limits: {
    residential: {
      day: 55,      // 06:00 - 22:00 dB(A)
      night: 40     // 22:00 - 06:00 dB(A)
    },
    commercial: {
      day: 65,
      night: 50
    },
    industrial: {
      day: 70,
      night: 55
    }
  },
  measurements: [
    { time: "00:00", level: 38, zone: "residential", compliant: true },
    { time: "03:00", level: 35, zone: "residential", compliant: true },
    { time: "06:00", level: 42, zone: "residential", compliant: true },
    { time: "09:00", level: 52, zone: "residential", compliant: true },
    { time: "12:00", level: 54, zone: "residential", compliant: true },
    { time: "15:00", level: 53, zone: "residential", compliant: true },
    { time: "18:00", level: 51, zone: "residential", compliant: true },
    { time: "21:00", level: 48, zone: "residential", compliant: true },
    { time: "22:00", level: 39, zone: "residential", compliant: true }
  ]
};

// Regulatory Compliance Status
const complianceData = {
  euDroneRegulation: {
    status: "compliant",
    regulation: "EU 2019/945 & EU 2019/947",
    lastCheck: "2023-11-15"
  },
  taLaerm: {
    status: "compliant",
    standard: "TA Lärm 1998",
    lastCheck: "2023-11-20"
  },
  sailIII: {
    status: "validated",
    framework: "SAIL III (Specific Assurance and Integrity Level)",
    lastCheck: "2023-11-18"
  }
};

// Historical Noise Level Data for Charts
const historicalNoiseData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: {
    route1: [50, 52, 51, 53, 52, 49, 50],
    route2: [56, 58, 57, 59, 58, 55, 56],
    route3: [46, 48, 47, 49, 48, 45, 46]
  }
};

// Export data for use in other modules (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fleetData,
    immissionsorte,
    routeData,
    taLaermData,
    complianceData,
    historicalNoiseData
  };
}

// Make available in browser global scope
if (typeof window !== 'undefined') {
  window.fleetData = fleetData;
  window.immissionsorte = immissionsorte;
  window.routeData = routeData;
  window.taLaermData = taLaermData;
  window.complianceData = complianceData;
  window.historicalNoiseData = historicalNoiseData;
}
