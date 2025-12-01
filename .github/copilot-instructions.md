# GitHub Copilot Instructions - MORPHEUS Dashboard

> Comprehensive coding guidelines and best practices for the MORPHEUS Drohnen-Standort & Routenanalyse Dashboard

## 📋 Projektübersicht

**Projekt:** MORPHEUS Dashboard - Live Dashboard für Drohnen-Standort & Routenanalyse  
**Zweck:** BVLOS-Drohnenroute Analyse mit TA Lärm Compliance Visualisierung  
**Zielgruppe:** Regulatory authorities (LBA), Stakeholder, Operations Teams  
**Standort:** Iserlohn, Deutschland (Zentrum: 51.371099, 7.693150)  
**Repository:** [Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse](https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse)

### Kernfunktionalität
- **Google Maps JavaScript API Integration**: Interaktive Karte mit 3D-Visualisierung
- **TA Lärm Compliance Monitoring**: Echtzeit-Überwachung der Lärmschutzverordnung
- **3-Routen-Vergleich**: Detaillierter Vergleich von drei optimierten Flugrouten
- **Immissionsorte Heatmap**: Visualisierung von Lärmmessungen als Heatmap
- **Flottenstand Widget**: Live-Status aller Drohnen in der Flotte
- **Regulatory Compliance Dashboard**: EU 2019/945, EU 2019/947, SAIL III Status

---

## 🛠️ Tech Stack & Abhängigkeiten

### Frontend Technologies
- **HTML5**: Semantic markup with ARIA attributes
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript ES6+**: Modern ECMAScript features

### Frameworks & Libraries
- **Tailwind CSS**: Utility-first CSS framework (via CDN v3.x)
- **Chart.js**: Data visualization library (v4.4.0+)
- **Google Maps JavaScript API**: Interactive mapping and geospatial visualization

### APIs & Services
- **Google Maps JavaScript API**: Core mapping functionality
- **Google Maps Visualization Library**: Heatmap rendering for noise data
- **Google Maps Places API** (optional): Location search and autocomplete

### Development Tools
- **HTTP Server**: Python `http.server` or Node.js `http-server`
- **Modern Browsers**: Chrome 100+, Firefox 100+, Safari 15+, Edge 90+

### Accessibility Standards
- **WCAG 2.1 Level AA**: Mandatory compliance
- **ARIA 1.2**: Proper use of roles, states, and properties

---

## 📐 Code-Standards

### Style Guide
**Primary:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

Key principles:
- Use `const` and `let`, never `var`
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Destructuring for objects and arrays
- Consistent spacing and indentation (2 spaces)

### Naming Conventions

#### Variables & Functions
```javascript
// camelCase für Variablen und Funktionen
const fleetStatus = getFleetData();
const routeAlternativeA = calculateRoute();
const immissionsortMarkers = [];

function updateDashboard() { }
function renderHeatmap(data) { }
```

#### Konstanten
```javascript
// UPPER_SNAKE_CASE für Konstanten
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const TA_LAERM_GRENZWERT_WOHNGEBIET_TAG = 55;
const MAX_FLIGHT_ALTITUDE = 120;
const DEFAULT_MAP_ZOOM = 13;
```

#### Dateien
```javascript
// kebab-case für Dateinamen
data-loader.js
route-visualizer.js
noise-analyzer.js
compliance-checker.js
```

### Kommentare & Dokumentation

**JSDoc für alle Funktionen:**
```javascript
/**
 * Validates GPS coordinates for required precision
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 * @returns {boolean} True if coordinates have exactly 6 decimal places
 * @throws {Error} If coordinates are out of valid range
 * @example
 * validateGpsCoordinates(51.371099, 7.693150) // returns true
 * validateGpsCoordinates(51.371, 7.693) // returns false
 */
function validateGpsCoordinates(lat, lng) {
  // Validation logic
}
```

### Sprachen
- **Primär:** Deutsch (DE) - für UI-Texte, Kommentare, Dokumentation
- **Sekundär:** Englisch (EN) - für Code-Identifikatoren, technische Begriffe
- **Mehrsprachigkeit:** Alle UI-Texte müssen übersetzbar sein (DE/EN)

---

## ⚠️ Kritische Constraints

### 1. GPS-Präzision
**REGEL:** GPS-Koordinaten MÜSSEN genau 6 Dezimalstellen haben

```javascript
// ✅ RICHTIG: Exakt 6 Dezimalstellen
const iserlohnCenter = { lat: 51.371099, lng: 7.693150 };
const immissionsort1 = { lat: 51.375421, lng: 7.698234 };

// ❌ FALSCH: Ungenaue Dezimalstellen
const wrongCoords = { lat: 51.371, lng: 7.693 };  // Zu wenige Dezimalstellen
const wrongCoords2 = { lat: 51.3710991, lng: 7.6931501 };  // Zu viele Dezimalstellen
```

**Validierungsfunktion (obligatorisch vor Rendering):**
```javascript
function validateGpsCoordinates(lat, lng) {
  const latDecimals = (lat.toString().split('.')[1] || '').length;
  const lngDecimals = (lng.toString().split('.')[1] || '').length;
  
  if (latDecimals !== 6 || lngDecimals !== 6) {
    console.error(`GPS validation failed: lat=${lat} (${latDecimals} decimals), lng=${lng} (${lngDecimals} decimals)`);
    return false;
  }
  
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.error(`GPS out of range: lat=${lat}, lng=${lng}`);
    return false;
  }
  
  return true;
}
```

### 2. TA Lärm Grenzwerte
**REGEL:** Grenzwerte MÜSSEN gegen offizielle Quellen validiert werden

**Offizielle Quelle:** [TA Lärm 1998 (BImSchG)](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)

```javascript
// Validierte TA Lärm Grenzwerte (in dB(A))
const TA_LAERM_GRENZWERT = {
  WOHNGEBIET_TAG: 55,      // [Quelle: TA Lärm 1998, Nr. 6.1 a]
  WOHNGEBIET_NACHT: 40,    // [Quelle: TA Lärm 1998, Nr. 6.1 a]
  GEWERBE_TAG: 65,         // [Quelle: TA Lärm 1998, Nr. 6.1 e]
  GEWERBE_NACHT: 50,       // [Quelle: TA Lärm 1998, Nr. 6.1 e]
  INDUSTRIE_TAG: 70,       // [Quelle: TA Lärm 1998, Nr. 6.1 f]
  INDUSTRIE_NACHT: 70      // [Quelle: TA Lärm 1998, Nr. 6.1 f]
};

/**
 * Checks TA Lärm compliance for given noise level and area type
 * @param {number} noiseLevel - Measured noise level in dB(A)
 * @param {string} areaType - Area type: 'residential', 'commercial', 'industrial'
 * @param {string} timeOfDay - Time period: 'day' (06:00-22:00) or 'night' (22:00-06:00)
 * @returns {boolean} Compliance status
 */
function checkTaLaermCompliance(noiseLevel, areaType, timeOfDay) {
  const thresholds = {
    residential: { day: 55, night: 40 },
    commercial: { day: 65, night: 50 },
    industrial: { day: 70, night: 70 }
  };
  
  const limit = thresholds[areaType]?.[timeOfDay];
  if (!limit) {
    throw new Error(`Invalid area type or time of day: ${areaType}, ${timeOfDay}`);
  }
  
  return noiseLevel <= limit;
}
```

### 3. API-Sicherheit
**REGEL:** KEINE hardcodierten API-Keys im Code

```javascript
// ❌ FALSCH: Hardcodierter API-Key
const apiKey = 'AIzaSyC...actual_key';

// ✅ RICHTIG: Aus Umgebungsvariablen laden
const apiKey = process.env.GOOGLE_MAPS_API_KEY || 
               localStorage.getItem('GOOGLE_MAPS_API_KEY') ||
               prompt('Please enter your Google Maps API key:');

if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
  throw new Error('Valid Google Maps API key required. Configure in .env file.');
}
```

**Security Checklist:**
- ✅ API-Keys in `.env` Datei (nicht committen!)
- ✅ `.env` in `.gitignore` aufgeführt
- ✅ `.env.example` mit Platzhaltern bereitstellen
- ✅ Keine Credentials in Versionskontrolle
- ✅ HTTPS für alle externen Ressourcen

### 4. Regulatory Compliance
**Pflicht-Frameworks:**
- **BImSchG** (Bundes-Immissionsschutzgesetz)
- **TA Lärm 1998** (Technische Anleitung zum Schutz gegen Lärm)
- **EASA EU 2019/945** (Requirements for unmanned aircraft systems)
- **EASA EU 2019/947** (Rules and procedures for operation of unmanned aircraft)
- **SAIL III** (Specific Assurance and Integrity Level III)

---

## 📁 Projektstruktur

```
Live_Dashboard_Drohnen_Standort-Routenanalyse/
├── index.html              # Haupt-HTML mit Dashboard-Layout
├── assets/
│   ├── data.js            # Validierte MORPHEUS Datenquellen
│   ├── maps.js            # Google Maps API Integration
│   ├── charts.js          # Chart.js Visualisierungen
│   └── styles.css         # Custom CSS & Tailwind-Überschreibungen
├── .env.example           # API-Key Template (niemals .env committen!)
├── .gitignore            # Git ignore patterns
├── .github/
│   ├── copilot-instructions.md  # Diese Datei
│   ├── prompts/          # Spezialisierte Prompts
│   ├── workflows/        # CI/CD Workflows
│   ├── CODEOWNERS        # Code ownership
│   └── PULL_REQUEST_TEMPLATE.md
├── LICENSE               # MIT-Lizenz
├── README.md             # Benutzerdokumentation
└── AGENTS.md             # Detaillierte Agent-Richtlinien
```

### Datei-Verantwortlichkeiten

#### `data.js` - Datenquellen
- Validierte GPS-Koordinaten (6 Dezimalstellen)
- Flottenspezifikationen (Status, Batterie, Position)
- TA Lärm Schwellwerte (offizielle Grenzwerte)
- Route-Definitionen (Waypoints, Metriken)
- Immissionsorte (Lärmmessstationen)

#### `maps.js` - Google Maps Integration
- Google Maps API Initialisierung
- Route-Rendering (3 Routen: Blau, Grün, Orange)
- Marker-Verwaltung (Immissionsorte, Waypoints)
- Heatmap-Visualisierung (Lärmmessungen)
- Info-Windows (TA Lärm Daten, Compliance-Status)
- Event-Handler (Zoom, Pan, Click)

#### `charts.js` - Visualisierungen
- Chart.js Konfiguration
- TA Lärm Compliance Charts (24h-Überwachung)
- Routen-Vergleichstabelle
- Multi-Metrik Radar Chart
- Historische Lärmbelastungs-Trends
- Responsive Chart-Sizing

#### `styles.css` - Styling
- Custom Utility-Klassen
- Regulatory Color-Coding (Grün/Gelb/Rot für Compliance)
- Responsive Breakpoints
- Focus-States für Accessibility
- Print-Styles

---

## 🎨 Entwickler-Workflows

### Accessibility First
**Pflicht:** Alle Features MÜSSEN WCAG 2.1 AA erfüllen

```html
<!-- ✅ RICHTIG: Semantic HTML mit ARIA -->
<button 
  id="toggleHeatmap" 
  class="btn-primary"
  aria-label="Toggle noise heatmap visibility"
  aria-pressed="false"
  onclick="toggleHeatmap()">
  <span aria-hidden="true">🗺️</span>
  Toggle Heatmap
</button>

<!-- ✅ RICHTIG: Skip Link für Keyboard Navigation -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- ✅ RICHTIG: Focus Management -->
<div 
  id="map" 
  role="application" 
  aria-label="Interactive map showing drone routes and noise measurement points"
  tabindex="0">
</div>
```

**Accessibility Checklist:**
- ✅ Semantic HTML (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`)
- ✅ ARIA labels für alle interaktiven Elemente
- ✅ Keyboard Navigation (Tab-Order, Focus-Indicators)
- ✅ Skip Links ("Skip to main content")
- ✅ Screen Reader Support (Alt-Texte, ARIA-Beschreibungen)
- ✅ Kontrastverhältnis ≥4.5:1 (normaler Text), ≥3:1 (großer Text)
- ✅ Responsive Text-Skalierung (bis 200%)
- ✅ `prefers-reduced-motion` respektieren

### Mobile First
**Responsive Design ab 320px**

```css
/* Mobile First: Start mit kleinsten Bildschirm */
.dashboard-card {
  width: 100%;
  padding: 1rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .dashboard-card {
    width: 50%;
    padding: 1.5rem;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .dashboard-card {
    width: 33.333%;
    padding: 2rem;
  }
}
```

### Testing-Strategie

**Vor jedem Commit testen:**
1. **GPS-Koordinaten Validierung**: Prüfe auf 6 Dezimalstellen
2. **TA Lärm Compliance**: Verifiziere Grenzwerte gegen offizielle Quellen
3. **API-Key Security**: Scanne nach hardcodierten Keys
4. **Accessibility**: Teste Keyboard Navigation und Screen Reader
5. **Responsive Design**: Teste auf Mobile (320px), Tablet (768px), Desktop (1024px)
6. **Cross-Browser**: Chrome, Firefox, Safari, Edge

---

## 📊 Datenquellen

### GPS-Daten (MORPHEUS System)
```javascript
// Echtzeit-Positionsdaten
const dronePosition = {
  lat: 51.371099,  // 6 Dezimalstellen erforderlich
  lng: 7.693150,
  altitude: 85,     // Meter über Meeresspiegel
  heading: 142,     // Grad (0-359)
  speed: 15.5,      // km/h
  timestamp: Date.now()
};
```

### SAIL III Framework
```javascript
// SAIL Level III: Medium-high risk BVLOS operations
const sailAssessment = {
  level: 3,
  operationType: 'BVLOS',
  groundRiskClass: 'MEDIUM',
  airRiskClass: 'MEDIUM',
  requiresDetailed: {
    operationalRiskAssessment: true,
    safetyManagementSystem: true,
    complianceMonitoring: true,
    contingencyPlanning: true
  }
};
```

### Regulatory Compliance
- **EU 2019/945**: UAS requirements (Drohnen-Hardware)
- **EU 2019/947**: Operation rules (Flugbetrieb)
- **TA Lärm 1998**: Noise protection standards (Lärmschutz)
- **BImSchG**: Federal emission control law (Immissionsschutz)

---

## 🔍 Best Practices

### 1. API-Integration
```javascript
/**
 * Loads Google Maps API with proper error handling
 * @returns {Promise<void>} Resolves when API is ready
 */
async function loadGoogleMapsApi() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error('Valid Google Maps API key required');
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    
    document.head.appendChild(script);
  });
}
```

### 2. Chart.js Visualisierungen
```javascript
/**
 * Creates TA Lärm compliance line chart with threshold lines
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Object>} noiseData - Hourly noise measurements
 * @returns {Chart} Chart.js instance
 */
function createTaLaermChart(canvas, noiseData) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: noiseData.map(d => d.hour),
      datasets: [{
        label: 'Lärmbelastung (dB(A))',
        data: noiseData.map(d => d.level),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }, {
        label: 'Grenzwert Tag (55 dB)',
        data: Array(24).fill(TA_LAERM_GRENZWERT.WOHNGEBIET_TAG),
        borderColor: '#EF4444',
        borderDash: [5, 5],
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'TA Lärm Compliance - 24h Überwachung'
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} dB(A)`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 30,
          max: 80,
          title: {
            display: true,
            text: 'Lärmpegel (dB(A))'
          }
        }
      }
    }
  });
}
```

### 3. Internationalisierung (i18n)
```javascript
const translations = {
  de: {
    'nav.title': 'MORPHEUS Dashboard',
    'fleet.total': 'Gesamtflotte',
    'route.distance': 'Distanz (km)',
    'ta.compliance': 'TA Lärm Konform'
  },
  en: {
    'nav.title': 'MORPHEUS Dashboard',
    'fleet.total': 'Total Fleet',
    'route.distance': 'Distance (km)',
    'ta.compliance': 'TA Noise Compliant'
  }
};

/**
 * Translates UI text based on selected language
 * @param {string} key - Translation key
 * @param {string} lang - Language code (de/en)
 * @returns {string} Translated text
 */
function translate(key, lang = 'de') {
  return translations[lang]?.[key] || key;
}
```

### 4. Performance-Optimierung
```javascript
// Debounce für Map-Events (Zoom, Pan)
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

// Anwendung
map.addListener('zoom_changed', debounce(() => {
  updateVisibleMarkers();
}, 300));
```

---

## 🔗 Referenzen

### Offizielle Dokumentation
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### Regulatory Sources
- [TA Lärm 1998 (Official)](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)
- [BImSchG (Federal Emission Control Act)](https://www.gesetze-im-internet.de/bimschg/)
- [EASA Drone Regulations](https://www.easa.europa.eu/domains/civil-drones)
- [EU 2019/945 (UAS Regulation)](https://eur-lex.europa.eu/eli/reg_del/2019/945/oj)
- [EU 2019/947 (Drone Operations)](https://eur-lex.europa.eu/eli/reg_impl/2019/947/oj)

### Projekt-Dokumente
- **[AGENTS.md](../AGENTS.md)**: Detaillierte Agent-Richtlinien für alle Domänen
- **[README.md](../README.md)**: Benutzerdokumentation und Setup-Anleitung
- **[Prompts](prompts/)**: Spezialisierte Prompts für häufige Aufgaben

---

## 💡 Wichtige Hinweise

### Für Copilot-Nutzer
1. **Lese immer AGENTS.md zuerst**: Enthält detaillierte Richtlinien für alle Domänen
2. **Verwende spezialisierte Prompts**: Siehe `.github/prompts/` für häufige Aufgaben
3. **Validiere GPS-Koordinaten**: Immer 6 Dezimalstellen erforderlich
4. **Prüfe TA Lärm Grenzwerte**: Gegen offizielle Quellen validieren
5. **Teste Accessibility**: WCAG 2.1 AA ist Pflicht, nicht Optional

### Code Review Prioritäten
1. **Security**: Keine hardcodierten API-Keys
2. **Data Validation**: GPS-Koordinaten, TA Lärm Grenzwerte
3. **Accessibility**: WCAG 2.1 AA Compliance
4. **Code Style**: Airbnb JavaScript Style Guide
5. **Documentation**: JSDoc für alle Funktionen

### Häufige Fehler vermeiden
- ❌ GPS-Koordinaten ohne 6 Dezimalstellen
- ❌ Hardcodierte API-Keys im Code
- ❌ Fehlende ARIA-Labels auf interaktiven Elementen
- ❌ Nicht-responsive Design
- ❌ TA Lärm Grenzwerte ohne Quellenangabe
- ❌ Fehlende JSDoc-Kommentare
- ❌ Cross-Browser-Inkompatibilitäten

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-01  
**Maintainer:** @Darkness308  
**Project:** MORPHEUS LOGISTIK Dashboard
