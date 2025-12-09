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
  { id: 1, lat: 52.520000, lng: 13.405000, name: "Berlin Zentrum", noiseLevel: 55, type: "residential" },
  { id: 2, lat: 52.517000, lng: 13.388900, name: "Tiergarten", noiseLevel: 48, type: "park" },
  { id: 3, lat: 52.524400, lng: 13.410500, name: "Alexanderplatz", noiseLevel: 62, type: "commercial" },
  { id: 4, lat: 52.519400, lng: 13.406700, name: "Museum Island", noiseLevel: 52, type: "cultural" },
  { id: 5, lat: 52.516300, lng: 13.377700, name: "Hauptbahnhof", noiseLevel: 58, type: "transport" },
  { id: 6, lat: 52.523400, lng: 13.414400, name: "Rotes Rathaus", noiseLevel: 54, type: "government" },
  { id: 7, lat: 52.518800, lng: 13.376400, name: "Reichstag", noiseLevel: 51, type: "government" },
  { id: 8, lat: 52.518600, lng: 13.408100, name: "Hackescher Markt", noiseLevel: 60, type: "commercial" },
  { id: 9, lat: 52.513900, lng: 13.423900, name: "Ostbahnhof", noiseLevel: 65, type: "transport" },
  { id: 10, lat: 52.509500, lng: 13.376500, name: "Potsdamer Platz", noiseLevel: 59, type: "commercial" }
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
      { lat: 52.520000, lng: 13.405000 },
      { lat: 52.522000, lng: 13.408000 },
      { lat: 52.524000, lng: 13.411000 },
      { lat: 52.526000, lng: 13.414000 },
      { lat: 52.528000, lng: 13.417000 }
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
      { lat: 52.520000, lng: 13.405000 },
      { lat: 52.521000, lng: 13.410000 },
      { lat: 52.523000, lng: 13.413000 },
      { lat: 52.525000, lng: 13.415000 },
      { lat: 52.528000, lng: 13.417000 }
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
      { lat: 52.520000, lng: 13.405000 },
      { lat: 52.519000, lng: 13.407000 },
      { lat: 52.521000, lng: 13.412000 },
      { lat: 52.524000, lng: 13.415500 },
      { lat: 52.528000, lng: 13.417000 }
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
