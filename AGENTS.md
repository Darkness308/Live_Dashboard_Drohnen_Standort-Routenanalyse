# AGENTS.md - MORPHEUS LOGISTIK Dashboard

## General Rules

### Project Overview
BVLOS drone route analysis dashboard for Iserlohn, Germany.
Visualizes TA Lärm noise compliance for 3 alternative routes.
Target users: Regulatory authorities (LBA), stakeholders, operational teams.

### Coding Standards
- **Language:** JavaScript ES6+, HTML5, CSS3
- **Style Guide:** Airbnb JavaScript Style Guide
- **Naming Conventions:**
  - Variables: camelCase (`flotteStand`, `routeAlternativeA`)
  - Constants: UPPER_SNAKE_CASE (`API_KEY`, `TA_LAERM_GRENZWERT`)
  - Files: kebab-case (`data-loader.js`, `route-visualizer.js`)
- **Comments:** JSDoc for all functions
- **Accessibility:** WCAG 2.1 AA mandatory

### Key Constraints
- ⚠️ NO hardcoded API keys (use .env)
- ⚠️ GPS precision: Exactly 6 decimals (e.g., 51.371099, 7.693150)
- ⚠️ TA Lärm thresholds MUST be validated against official sources
- ⚠️ German regulatory compliance: BImSchG, TA Lärm, EASA SAIL III

---

## Repository Structure

```
morpheus-dashboard/
├── index.html              # Haupteinstiegspunkt
├── assets/
│   ├── data.js            # Statische JSON-Daten (Standorte, Routen, Flotten)
│   ├── maps.js            # Google Maps API-Integration
│   ├── charts.js          # Chart.js-Visualisierungen
│   └── styles.css         # Tailwind-Überschreibungen & benutzerdefinierte Stile
├── .env.example           # API-Schlüsselvorlage (NICHT COMMITTEN!)
├── .gitignore            # Git ignore patterns for secrets and build artifacts
├── LICENSE               # MIT-Lizenz
├── README.md             # Lesbare Dokumentation
└── AGENTS.md             # Diese Datei
```

### File Responsibilities
- **data.js:** Contains all validated GPS coordinates, fleet specs, TA Lärm thresholds
- **maps.js:** Initializes Google Maps, draws routes, handles markers
- **charts.js:** Renders noise impact charts, fleet statistics
- **styles.css:** Custom utility classes for regulatory color coding

---

## Dependencies and Installation

### Prerequisites
- Node.js 18+ (for local dev server)
- Google Cloud Platform account (Maps API key)
- Modern browser (Chrome 100+, Firefox 100+, Safari 15+)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse.git
   cd Live_Dashboard_Drohnen_Standort-Routenanalyse
   ```

2. **Configure Google Maps API:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Google Maps API key
   ```

3. **Start local development server:**
   ```bash
   # Option 1: Python
   python -m http.server 8000
   
   # Option 2: Node.js
   npx http-server -p 8000
   ```

4. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Required APIs
Ensure these APIs are enabled in Google Cloud Console:
- Maps JavaScript API
- Maps SDK for Android (optional for mobile)
- Visualization Library (for heatmaps)

---

## Domain-Specific Guidelines

### 1. Frontend Development Agent

**Responsibilities:**
- HTML structure modifications
- CSS styling and responsive design
- JavaScript UI interactions
- Tailwind CSS utility classes

**Rules:**
- Always maintain WCAG 2.1 AA accessibility standards
- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`)
- Include ARIA labels for screen readers (`aria-label`, `role`, `aria-describedby`)
- Ensure keyboard navigation support (tab order, focus indicators)
- Test responsive design breakpoints (mobile: 320px+, tablet: 768px+, desktop: 1024px+)
- Respect `prefers-reduced-motion` media query
- Maintain color contrast ratios ≥4.5:1 for normal text, ≥3:1 for large text

**Key Files:**
- `index.html` - Main dashboard structure
- `assets/styles.css` - Custom styles and CSS variables

**Example Task:**
```javascript
// ✅ Good: Accessible button with ARIA
<button 
  id="toggleHeatmap" 
  class="btn-primary" 
  aria-label="Toggle noise heatmap visibility"
  aria-pressed="false">
  Toggle Heatmap
</button>

// ❌ Bad: Non-accessible button
<div onclick="toggleHeatmap()">Toggle</div>
```

---

### 2. Google Maps Integration Agent

**Responsibilities:**
- Google Maps JavaScript API integration
- Route visualization and overlays
- Marker management for Immissionsorte
- Heatmap layer for noise visualization
- 3D terrain view integration

**Rules:**
- API key MUST be loaded from environment variables, not hardcoded
- GPS coordinates MUST have exactly 6 decimal places (e.g., `51.371099`)
- Use Google Maps API v3 features: `google.maps.Map`, `google.maps.Polyline`, `google.maps.visualization.HeatmapLayer`
- Implement error handling for API loading failures
- Add loading indicators during map initialization
- Include fallback content if Maps API fails to load

**Key Files:**
- `assets/maps.js` - Maps initialization and controls
- `assets/data.js` - GPS coordinates and waypoints

**Constants:**
```javascript
// TA Lärm Grenzwerte (dB(A))
const TA_LAERM_GRENZWERT = {
  WOHNGEBIET_TAG: 55,      // Residential area, daytime (06:00-22:00)
  WOHNGEBIET_NACHT: 40,    // Residential area, nighttime (22:00-06:00)
  GEWERBE_TAG: 65,         // Commercial area, daytime
  GEWERBE_NACHT: 50,       // Commercial area, nighttime
  INDUSTRIE_TAG: 70,       // Industrial area, daytime
  INDUSTRIE_NACHT: 70      // Industrial area, nighttime
};

// Iserlohn, Germany - Base coordinates
const ISERLOHN_CENTER = {
  lat: 51.371099,
  lng: 7.693150
};
```

**Example Task:**
```javascript
/**
 * Initializes Google Maps with route overlays
 * @param {HTMLElement} mapContainer - DOM element for map
 * @param {Object} options - Map configuration options
 * @returns {google.maps.Map} Initialized map instance
 */
function initializeMap(mapContainer, options) {
  const map = new google.maps.Map(mapContainer, {
    center: ISERLOHN_CENTER,
    zoom: 13,
    mapTypeId: 'hybrid',
    ...options
  });
  
  return map;
}
```

---

### 3. Data Visualization Agent (Chart.js)

**Responsibilities:**
- Chart.js configuration and rendering
- TA Lärm compliance charts (line, bar, radar)
- Route comparison visualizations
- Historical trend analysis
- Responsive chart sizing

**Rules:**
- Use Chart.js v4.4.0+ features
- Ensure charts are responsive and accessible
- Include chart descriptions for screen readers (`aria-label`)
- Use consistent color scheme matching route colors
- Add tooltips with detailed information
- Implement data decimation for performance (large datasets)

**Key Files:**
- `assets/charts.js` - Chart configurations and updates
- `assets/data.js` - Chart data sources

**Chart Types:**
1. **TA Lärm Compliance Chart** (Line): 24-hour noise monitoring
2. **Route Comparison Table** (Table): Distance, duration, noise, energy, compliance
3. **Multi-Metric Radar Chart** (Radar): 5-axis route comparison
4. **Historical Noise Trend** (Line): 7-day trend for all routes

**Example Task:**
```javascript
/**
 * Creates TA Lärm compliance line chart
 * @param {HTMLCanvasElement} canvas - Canvas element for chart
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
        label: 'Grenzwert Tag',
        data: Array(24).fill(TA_LAERM_GRENZWERT.WOHNGEBIET_TAG),
        borderColor: '#EF4444',
        borderDash: [5, 5]
      }]
    },
    options: {
      responsive: true,
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
      }
    }
  });
}
```

---

### 4. Data Management Agent

**Responsibilities:**
- MORPHEUS data source integration
- GPS coordinate validation
- SAIL III compliance data
- Fleet status updates
- Immissionsorte management

**Rules:**
- All GPS coordinates MUST have exactly 6 decimal places
- Validate data against SAIL III requirements
- Ensure TA Lärm thresholds are from official sources
- No hardcoded sensitive data
- Use constants for regulatory thresholds
- Implement data validation functions

**Key Files:**
- `assets/data.js` - Primary data source

**Data Structures:**
```javascript
// Fleet Status
const fleetData = {
  totalDrones: Number,      // Total drones in fleet
  activeDrones: Number,     // Currently flying
  charging: Number,         // Charging station
  maintenance: Number,      // Under maintenance
  batteryLevels: {
    high: Number,          // > 70%
    medium: Number,        // 30-70%
    low: Number            // < 30%
  }
};

// Immissionsort (Noise Measurement Point)
const immissionsortSchema = {
  id: Number,              // Unique identifier
  lat: Number,             // Latitude (6 decimals)
  lng: Number,             // Longitude (6 decimals)
  name: String,            // Location name
  noiseLevel: Number,      // Current noise level (dB(A))
  type: String             // Type: residential, commercial, industrial, park, transport
};

// Route Data
const routeSchema = {
  name: String,            // Route name
  color: String,           // Hex color code
  distance: Number,        // Distance in km
  duration: Number,        // Duration in minutes
  noiseExposure: Number,   // Average noise exposure (dB(A))
  energyConsumption: Number, // Battery usage (%)
  taCompliance: Boolean,   // TA Lärm compliance status
  waypoints: Array         // Array of {lat, lng} objects
};
```

**Example Task:**
```javascript
/**
 * Validates GPS coordinates for required precision
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates have exactly 6 decimal places
 */
function validateGpsCoordinates(lat, lng) {
  const latDecimals = (lat.toString().split('.')[1] || '').length;
  const lngDecimals = (lng.toString().split('.')[1] || '').length;
  return latDecimals === 6 && lngDecimals === 6;
}

/**
 * Checks if noise level complies with TA Lärm for given area type and time
 * @param {number} noiseLevel - Measured noise level in dB(A)
 * @param {string} areaType - Area type: 'residential', 'commercial', 'industrial'
 * @param {string} timeOfDay - 'day' or 'night'
 * @returns {boolean} Compliance status
 */
function checkTaLaermCompliance(noiseLevel, areaType, timeOfDay) {
  const thresholds = {
    residential: { day: 55, night: 40 },
    commercial: { day: 65, night: 50 },
    industrial: { day: 70, night: 70 }
  };
  
  const limit = thresholds[areaType]?.[timeOfDay];
  return noiseLevel <= limit;
}
```

---

### 5. Internationalization (i18n) Agent

**Responsibilities:**
- Language switching functionality (DE/EN)
- Translation management
- Dynamic UI text updates
- Chart label translations
- Date/time formatting

**Rules:**
- Support German (DE) and English (EN)
- Default language: German (DE)
- Persist language preference in localStorage
- Update all UI elements, chart labels, and tooltips on language change
- Use consistent terminology for regulatory terms

**Key Terms:**
```javascript
const translations = {
  de: {
    // Navigation
    'nav.title': 'MORPHEUS Dashboard',
    'nav.subtitle': 'Drohnen-Standort & Routenanalyse',
    
    // Fleet Widget
    'fleet.title': 'Flottenstand',
    'fleet.total': 'Gesamtflotte',
    'fleet.active': 'Aktiv im Flug',
    'fleet.charging': 'Im Ladevorgang',
    'fleet.maintenance': 'In Wartung',
    
    // TA Lärm
    'ta.laerm': 'TA Lärm',
    'ta.compliance': 'Compliance-Status',
    'ta.threshold': 'Grenzwert',
    'ta.daytime': 'Tagzeit (06:00-22:00)',
    'ta.nighttime': 'Nachtzeit (22:00-06:00)',
    
    // Routes
    'route.comparison': 'Routenvergleich',
    'route.distance': 'Distanz (km)',
    'route.duration': 'Flugdauer (Min)',
    'route.noise': 'Lärmbelastung (dB)',
    'route.energy': 'Energieverbrauch (%)',
    
    // Regulatory
    'reg.easa': 'EASA Konformität',
    'reg.sail': 'SAIL III Framework',
    'reg.bimschg': 'BImSchG Compliance'
  },
  en: {
    // Navigation
    'nav.title': 'MORPHEUS Dashboard',
    'nav.subtitle': 'Drone Location & Route Analysis',
    
    // Fleet Widget
    'fleet.title': 'Fleet Status',
    'fleet.total': 'Total Fleet',
    'fleet.active': 'Active in Flight',
    'fleet.charging': 'Charging',
    'fleet.maintenance': 'Maintenance',
    
    // TA Lärm
    'ta.laerm': 'TA Noise',
    'ta.compliance': 'Compliance Status',
    'ta.threshold': 'Threshold',
    'ta.daytime': 'Daytime (06:00-22:00)',
    'ta.nighttime': 'Nighttime (22:00-06:00)',
    
    // Routes
    'route.comparison': 'Route Comparison',
    'route.distance': 'Distance (km)',
    'route.duration': 'Flight Duration (Min)',
    'route.noise': 'Noise Exposure (dB)',
    'route.energy': 'Energy Consumption (%)',
    
    // Regulatory
    'reg.easa': 'EASA Conformity',
    'reg.sail': 'SAIL III Framework',
    'reg.bimschg': 'BImSchG Compliance'
  }
};
```

---

### 6. Accessibility (A11y) Agent

**Responsibilities:**
- WCAG 2.1 AA compliance verification
- Keyboard navigation implementation
- Screen reader optimization
- Focus management
- Color contrast verification

**Rules:**
- All interactive elements MUST be keyboard accessible
- Provide skip links ("Skip to main content")
- Use semantic HTML elements
- Include ARIA labels and roles
- Maintain focus indicators (outline, ring)
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Ensure minimum contrast ratios: 4.5:1 (normal text), 3:1 (large text)

**WCAG 2.1 AA Checklist:**
- ✅ **1.1.1** Non-text Content: Alt text for images
- ✅ **1.3.1** Info and Relationships: Semantic HTML
- ✅ **1.4.3** Contrast (Minimum): 4.5:1 ratio
- ✅ **2.1.1** Keyboard: All functionality via keyboard
- ✅ **2.4.1** Bypass Blocks: Skip navigation links
- ✅ **2.4.7** Focus Visible: Clear focus indicators
- ✅ **3.1.1** Language of Page: `lang` attribute
- ✅ **4.1.2** Name, Role, Value: ARIA attributes

**Example Tasks:**
```html
<!-- ✅ Accessible Map Container -->
<div 
  id="map" 
  role="application" 
  aria-label="Interactive map showing drone routes and noise measurement points"
  tabindex="0">
</div>

<!-- ✅ Accessible Route Toggle -->
<fieldset>
  <legend>Route Visibility Controls</legend>
  <label>
    <input 
      type="checkbox" 
      id="toggleRouteA" 
      checked
      aria-describedby="routeADescription">
    <span>Route A (Optimized)</span>
  </label>
  <span id="routeADescription" class="sr-only">
    Blue route with 8.5km distance, 18 minutes duration, TA Lärm compliant
  </span>
</fieldset>

<!-- ✅ Screen Reader Only Text -->
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

---

### 7. Security & Environment Agent

**Responsibilities:**
- Environment variable management
- API key security
- Sensitive data protection
- .gitignore maintenance
- Security best practices

**Rules:**
- NEVER commit API keys or secrets
- Use `.env` file for sensitive configuration (add to .gitignore)
- Provide `.env.example` with placeholder values
- Validate environment variables on load
- Implement rate limiting for API calls
- Use HTTPS for all external resources

**Environment Variables:**
```bash
# .env (NOT committed to git)
GOOGLE_MAPS_API_KEY=AIzaSyC...actual_key_here
ENABLE_HEATMAP=true
ENABLE_3D_VIEW=true
ENABLE_ROUTE_COMPARISON=true
DEFAULT_LANGUAGE=DE
```

**Security Checklist:**
- ✅ API keys in `.env` file
- ✅ `.env` listed in `.gitignore`
- ✅ `.env.example` with placeholders provided
- ✅ No hardcoded credentials in source code
- ✅ HTTPS for external resources (CDNs, APIs)
- ✅ Input validation for user-provided data
- ✅ CSP (Content Security Policy) headers (if server available)

**Example Task:**
```javascript
/**
 * Loads Google Maps API with key from environment
 * @returns {Promise<void>} Resolves when API is loaded
 */
async function loadGoogleMapsApi() {
  // ❌ BAD: Hardcoded API key
  // const apiKey = 'AIzaSyC...';
  
  // ✅ GOOD: Load from environment or prompt user
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 
                 prompt('Please enter your Google Maps API key:');
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error('Valid Google Maps API key required');
  }
  
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
  script.async = true;
  script.defer = true;
  
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

---

### 8. Testing & Quality Assurance Agent

**Responsibilities:**
- Unit testing (if test framework exists)
- Integration testing
- Cross-browser testing
- Performance testing
- Accessibility testing

**Testing Priorities:**
1. **GPS Coordinate Validation**: Ensure 6 decimal precision
2. **TA Lärm Compliance**: Verify threshold calculations
3. **Route Rendering**: Test all 3 routes display correctly
4. **Language Switching**: Verify translations apply correctly
5. **Responsive Design**: Test breakpoints (320px, 768px, 1024px, 1920px)
6. **Keyboard Navigation**: Test tab order and focus management
7. **API Error Handling**: Test Maps API failure scenarios

**Browser Support:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Performance Metrics:**
- Initial load: < 3 seconds
- Time to interactive: < 5 seconds
- Lighthouse score: > 90
- Accessibility score: 100

---

## Regulatory Compliance References

### German Regulations

**TA Lärm (Technische Anleitung zum Schutz gegen Lärm)**
- **Official Source:** [BImSchG TA Lärm 1998](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)
- **Grenzwerte Wohngebiete:**
  - Tag (06:00-22:00): 55 dB(A)
  - Nacht (22:00-06:00): 40 dB(A)
- **Grenzwerte Gewerbegebiete:**
  - Tag: 65 dB(A)
  - Nacht: 50 dB(A)
- **Grenzwerte Industriegebiete:**
  - Tag/Nacht: 70 dB(A)

**BImSchG (Bundes-Immissionsschutzgesetz)**
- **Purpose:** Federal emission control law
- **Relevance:** Legal framework for noise protection
- **Reference:** [BImSchG Official Text](https://www.gesetze-im-internet.de/bimschg/)

### European Regulations

**EASA (European Union Aviation Safety Agency)**
- **EU 2019/945:** Requirements for unmanned aircraft systems
- **EU 2019/947:** Rules and procedures for operation of unmanned aircraft
- **Reference:** [EASA Drone Regulations](https://www.easa.europa.eu/domains/civil-drones)

**SAIL III (Specific Assurance and Integrity Level)**
- **Framework:** Risk assessment for BVLOS operations
- **Level III:** Medium-high risk operations requiring robust mitigation
- **Requirements:**
  - Detailed operational risk assessment
  - Safety management system
  - Compliance with operational procedures
  - Contingency planning

---

## Development Workflow

### 1. Before Making Changes
```bash
# Pull latest changes
git pull origin main

# Review current state
git status

# Check for existing issues or PRs
# Review AGENTS.md and README.md
```

### 2. Making Changes
- Follow coding standards (Airbnb JavaScript Style Guide)
- Use semantic commit messages
- Test changes locally before committing
- Ensure accessibility compliance
- Validate GPS coordinates (6 decimals)
- Check TA Lärm thresholds against official sources

### 3. Testing Locally
```bash
# Start local server
python -m http.server 8000

# Open browser to http://localhost:8000
# Test in multiple browsers
# Verify responsive design
# Check browser console for errors
# Test keyboard navigation
```

### 4. Commit Guidelines
```bash
# Semantic commit messages
git commit -m "feat: Add new route optimization algorithm"
git commit -m "fix: Correct TA Lärm threshold for commercial zones"
git commit -m "docs: Update API documentation in AGENTS.md"
git commit -m "style: Format code according to Airbnb style guide"
git commit -m "refactor: Simplify route rendering logic"
git commit -m "test: Add unit tests for GPS validation"
git commit -m "chore: Update dependencies"
```

### 5. Code Review Checklist
- [ ] Code follows Airbnb JavaScript Style Guide
- [ ] JSDoc comments for all functions
- [ ] No hardcoded API keys or secrets
- [ ] GPS coordinates have exactly 6 decimals
- [ ] TA Lärm thresholds validated against official sources
- [ ] WCAG 2.1 AA accessibility maintained
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Cross-browser compatibility verified
- [ ] No console errors or warnings
- [ ] Translations updated for DE/EN

---

## Common Tasks & Examples

### Task: Add New Immissionsort

```javascript
// 1. Add to data.js
const newImmissionsort = {
  id: 11,
  lat: 51.371099,  // Exactly 6 decimals
  lng: 7.693150,   // Exactly 6 decimals
  name: "Neuer Messpunkt Iserlohn",
  noiseLevel: 52,  // dB(A)
  type: "residential"
};

immissionsorte.push(newImmissionsort);

// 2. Update map visualization in maps.js
function addImmissionsortMarker(map, immissionsort) {
  const marker = new google.maps.Marker({
    position: { lat: immissionsort.lat, lng: immissionsort.lng },
    map: map,
    title: immissionsort.name,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: getNoiseColor(immissionsort.noiseLevel),
      fillOpacity: 0.8,
      strokeColor: '#fff',
      strokeWeight: 2
    }
  });
  
  // Add info window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div class="info-window">
        <h3>${immissionsort.name}</h3>
        <p>Lärmbelastung: ${immissionsort.noiseLevel} dB(A)</p>
        <p>Typ: ${immissionsort.type}</p>
      </div>
    `
  });
  
  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}

// 3. Color coding based on TA Lärm compliance
function getNoiseColor(noiseLevel) {
  if (noiseLevel <= 40) return '#10B981';  // Green - very low
  if (noiseLevel <= 55) return '#3B82F6';  // Blue - acceptable day
  if (noiseLevel <= 65) return '#F59E0B';  // Orange - warning
  return '#EF4444';                         // Red - exceeds limits
}
```

### Task: Add New Route

```javascript
// 1. Define route in data.js
const routeData = {
  // ... existing routes
  route4: {
    name: "Neue Route D",
    color: "#8B5CF6",  // Purple
    distance: 9.8,
    duration: 21,
    noiseExposure: 54,
    energyConsumption: 78,
    taCompliance: true,
    waypoints: [
      { lat: 51.371099, lng: 7.693150 },
      { lat: 51.375421, lng: 7.698234 },
      { lat: 51.379876, lng: 7.703567 },
      { lat: 51.384123, lng: 7.708901 }
    ]
  }
};

// 2. Render route on map (maps.js)
function renderRoute(map, route) {
  const routePath = new google.maps.Polyline({
    path: route.waypoints,
    geodesic: true,
    strokeColor: route.color,
    strokeOpacity: 0.8,
    strokeWeight: 4,
    map: map
  });
  
  // Add waypoint markers
  route.waypoints.forEach((waypoint, index) => {
    new google.maps.Marker({
      position: waypoint,
      map: map,
      label: `${index + 1}`,
      title: `${route.name} - Waypoint ${index + 1}`
    });
  });
}

// 3. Update route comparison table (update HTML)
// 4. Update charts with new route data
```

### Task: Update TA Lärm Thresholds

```javascript
// IMPORTANT: Always verify against official sources before updating

// 1. Update constants in data.js or dedicated config file
const TA_LAERM_GRENZWERT = {
  WOHNGEBIET_TAG: 55,      // [Source: TA Lärm 1998, Nr. 6.1 a]
  WOHNGEBIET_NACHT: 40,    // [Source: TA Lärm 1998, Nr. 6.1 a]
  GEWERBE_TAG: 65,         // [Source: TA Lärm 1998, Nr. 6.1 e]
  GEWERBE_NACHT: 50,       // [Source: TA Lärm 1998, Nr. 6.1 e]
  INDUSTRIE_TAG: 70,       // [Source: TA Lärm 1998, Nr. 6.1 f]
  INDUSTRIE_NACHT: 70      // [Source: TA Lärm 1998, Nr. 6.1 f]
};

// 2. Update validation functions
// 3. Update chart threshold lines
// 4. Update documentation with source references
```

---

## Performance Optimization Guidelines

### 1. Map Performance
- Use marker clustering for > 100 markers
- Implement lazy loading for off-screen elements
- Debounce map interactions (zoom, pan)
- Limit heatmap data points to visible area

### 2. Chart Performance
- Use data decimation for large datasets (> 1000 points)
- Disable animations on low-end devices
- Implement virtual scrolling for large tables
- Cache chart instances, update data only

### 3. Asset Optimization
- Use CDN for external libraries (Tailwind, Chart.js)
- Implement browser caching headers
- Compress images and assets
- Lazy load non-critical resources

---

## Troubleshooting Guide

### Issue: Google Maps Not Loading
**Symptoms:** Blank map area, console error "Google is not defined"
**Solutions:**
1. Check API key is correct in `.env`
2. Verify Maps JavaScript API is enabled in Google Cloud Console
3. Check browser console for specific error messages
4. Ensure script loads before map initialization
5. Check for CORS issues (must use HTTP server, not file://)

### Issue: Charts Not Rendering
**Symptoms:** Empty chart containers, no error messages
**Solutions:**
1. Verify Chart.js is loaded (check Network tab)
2. Ensure canvas elements have IDs matching JavaScript
3. Check data format matches Chart.js requirements
4. Verify chart container has explicit height/width
5. Check for JavaScript errors in console

### Issue: GPS Coordinates Invalid
**Symptoms:** Markers not appearing, console warnings
**Solutions:**
1. Verify coordinates have exactly 6 decimal places
2. Check latitude range: -90 to 90
3. Check longitude range: -180 to 180
4. Use validation function before rendering
5. Format: `{ lat: 51.371099, lng: 7.693150 }`

### Issue: Accessibility Violations
**Symptoms:** Screen reader issues, keyboard navigation broken
**Solutions:**
1. Run accessibility audit (Chrome DevTools, axe, WAVE)
2. Check all interactive elements have ARIA labels
3. Verify tab order is logical
4. Ensure focus indicators are visible
5. Test with actual screen reader software

---

## Resources & References

### Official Documentation
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

### Tools & Testing
- [Chrome DevTools Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools (Accessibility)](https://www.deque.com/axe/devtools/)
- [WAVE Accessibility Tool](https://wave.webaim.org/)
- [Can I Use (Browser Compatibility)](https://caniuse.com/)
- [ESLint (JavaScript Linting)](https://eslint.org/)

---

## Version History

### Version 1.0.0 (December 2024)
- Initial AGENTS.md creation
- Comprehensive agent guidelines for all domains
- Coding standards and best practices
- Regulatory compliance references
- Common tasks and examples
- Troubleshooting guide

---

## Contact & Support

For questions, issues, or contributions:
- **GitHub Issues:** [Create an issue](https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse/issues)
- **Project Team:** MORPHEUS Logistik
- **Maintainer:** Darkness308

---

**Last Updated:** December 1, 2024
**Document Version:** 1.0.0
**Project:** MORPHEUS LOGISTIK Dashboard - Live Dashboard Drohnen Standort & Routenanalyse
