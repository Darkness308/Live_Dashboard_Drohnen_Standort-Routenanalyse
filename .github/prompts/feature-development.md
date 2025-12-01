# Feature Development Prompt - MORPHEUS Dashboard

> Systematic approach for developing new features in MORPHEUS Drohnen-Dashboard

## 🎯 Feature-Entwicklungs-Framework

Dieser Prompt führt dich durch die vollständige Entwicklung eines neuen Features für das MORPHEUS Dashboard, von der Planung bis zur Implementierung.

---

## 📋 Phase 1: Planung & Requirements

### 1.1 Feature-Definition

**Beschreibe das Feature:**
- **Was:** [Beschreibung der Funktionalität]
- **Warum:** [Business Value / User Benefit]
- **Wer:** [Zielgruppe: LBA, Stakeholder, Operations Team]
- **Wie:** [Technische Umsetzung - High Level]

**Beispiel:**
```
Was: Neue Route D mit alternativer Flugroute hinzufügen
Warum: Erhöhte Flexibilität bei Wetteränderungen, verbesserte TA Lärm Compliance
Wer: Operations Team für Routenplanung, LBA für Genehmigung
Wie: Route-Daten in data.js hinzufügen, Map-Rendering erweitern, Charts aktualisieren
```

### 1.2 Acceptance Criteria

**Definiere messbare Erfolgskriterien:**
- [ ] Funktionalität vollständig implementiert
- [ ] WCAG 2.1 AA Accessibility erfüllt
- [ ] GPS-Koordinaten mit 6 Dezimalstellen validiert
- [ ] TA Lärm Compliance berechnet und visualisiert
- [ ] Responsive Design (Mobile, Tablet, Desktop)
- [ ] Cross-Browser getestet (Chrome, Firefox, Safari, Edge)
- [ ] JSDoc-Dokumentation vollständig
- [ ] Keine hardcodierten Secrets

### 1.3 Accessibility Requirements

**WCAG 2.1 AA Pflicht-Anforderungen:**
- [ ] **Semantic HTML**: Korrekte Tags (`<button>` für Buttons, nicht `<div>`)
- [ ] **ARIA Labels**: Alle interaktiven Elemente beschriftet
- [ ] **Keyboard Navigation**: Vollständig ohne Maus bedienbar
- [ ] **Focus Indicators**: Sichtbare Focus-States
- [ ] **Screen Reader Support**: Aussagekräftige Alt-Texte und ARIA-Beschreibungen
- [ ] **Kontrast**: Text ≥4.5:1, Large Text ≥3:1, UI-Komponenten ≥3:1
- [ ] **Responsive Text**: Skalierbar bis 200% ohne Funktionsverlust
- [ ] **Motion Sensitivity**: `prefers-reduced-motion` respektiert

---

## 🏗️ Phase 2: Architektur & Design

### 2.1 Datenstruktur-Design

**Definiere benötigte Datenstrukturen:**

```javascript
/**
 * Beispiel: Neue Route hinzufügen
 */
const newRouteData = {
  id: 'route4',
  name: 'Route D - Wetteralternative',
  color: '#8B5CF6',  // Purple
  distance: 9.8,     // km
  duration: 21,      // Minuten
  noiseExposure: 54, // dB(A)
  energyConsumption: 78, // %
  taCompliance: true,
  waypoints: [
    { lat: 51.371099, lng: 7.693150 },  // Start - 6 Dezimalstellen!
    { lat: 51.375421, lng: 7.698234 },
    { lat: 51.379876, lng: 7.703567 },
    { lat: 51.384123, lng: 7.708901 }   // Ende
  ],
  metadata: {
    createdAt: '2025-12-01',
    sailLevel: 3,
    weatherSuitability: ['rain', 'wind'],
    regulatoryApproval: {
      lba: true,
      taLaerm: true,
      easa: true
    }
  }
};
```

**GPS-Koordinaten Validierung:**
```javascript
// IMMER vor dem Speichern validieren
newRouteData.waypoints.forEach((wp, index) => {
  if (!validateGpsCoordinates(wp.lat, wp.lng)) {
    throw new Error(`Invalid GPS at waypoint ${index}: lat=${wp.lat}, lng=${wp.lng}`);
  }
});
```

### 2.2 UI/UX-Design

**Skizziere die Benutzeroberfläche:**

```html
<!-- Beispiel: Route Toggle Control -->
<div class="route-controls" role="group" aria-labelledby="route-controls-label">
  <h3 id="route-controls-label" class="text-lg font-semibold mb-2">
    Routen-Sichtbarkeit
  </h3>
  
  <div class="space-y-2">
    <!-- Route A Toggle -->
    <label class="flex items-center space-x-2 cursor-pointer">
      <input 
        type="checkbox" 
        id="toggleRouteA"
        checked
        class="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle Route A visibility">
      <span class="flex items-center">
        <span class="w-4 h-1 bg-blue-600 mr-2"></span>
        Route A (Optimiert)
      </span>
    </label>
    
    <!-- Route D Toggle (NEW) -->
    <label class="flex items-center space-x-2 cursor-pointer">
      <input 
        type="checkbox" 
        id="toggleRouteD"
        checked
        class="w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500"
        aria-label="Toggle Route D visibility">
      <span class="flex items-center">
        <span class="w-4 h-1 bg-purple-600 mr-2"></span>
        Route D (Wetteralternative)
      </span>
    </label>
  </div>
</div>
```

**Responsive Breakpoints:**
```css
/* Mobile First: 320px+ */
.route-controls {
  width: 100%;
  padding: 1rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .route-controls {
    width: 50%;
    padding: 1.5rem;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .route-controls {
    width: 33.333%;
    padding: 2rem;
  }
}
```

### 2.3 Komponenten-Mapping

**Identifiziere betroffene Dateien:**

| Datei | Änderungen | Priorität |
|-------|-----------|-----------|
| `assets/data.js` | Route-Daten hinzufügen | 🔴 Hoch |
| `assets/maps.js` | Route-Rendering erweitern | 🔴 Hoch |
| `assets/charts.js` | Charts mit neuer Route aktualisieren | 🟡 Mittel |
| `assets/styles.css` | Farbe für Route D definieren | 🟢 Niedrig |
| `index.html` | Toggle-Control hinzufügen | 🔴 Hoch |

---

## 💻 Phase 3: Implementierung

### 3.1 Data Layer (data.js)

**Schritt 1: Route-Daten hinzufügen**

```javascript
// In assets/data.js

const routeData = {
  // Existing routes...
  route1: { /* ... */ },
  route2: { /* ... */ },
  route3: { /* ... */ },
  
  // NEW: Route D
  route4: {
    name: "Route D - Wetteralternative",
    color: "#8B5CF6",
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

/**
 * Validates all routes have correct GPS precision
 * @throws {Error} If any coordinate has incorrect precision
 */
function validateAllRoutes() {
  Object.values(routeData).forEach(route => {
    route.waypoints.forEach((wp, index) => {
      if (!validateGpsCoordinates(wp.lat, wp.lng)) {
        throw new Error(
          `Invalid GPS in ${route.name} at waypoint ${index}: ` +
          `lat=${wp.lat}, lng=${wp.lng}`
        );
      }
    });
  });
}

// Run validation on load
validateAllRoutes();
```

### 3.2 Map Layer (maps.js)

**Schritt 2: Route auf Karte rendern**

```javascript
// In assets/maps.js

/**
 * Renders a route polyline on the Google Map
 * @param {google.maps.Map} map - The map instance
 * @param {Object} route - Route data object
 * @param {string} routeId - Unique route identifier
 * @returns {google.maps.Polyline} The created polyline
 */
function renderRoute(map, route, routeId) {
  // Validate GPS coordinates before rendering
  route.waypoints.forEach((wp, index) => {
    if (!validateGpsCoordinates(wp.lat, wp.lng)) {
      throw new Error(`Invalid waypoint ${index} in ${routeId}`);
    }
  });
  
  const polyline = new google.maps.Polyline({
    path: route.waypoints,
    geodesic: true,
    strokeColor: route.color,
    strokeOpacity: 0.8,
    strokeWeight: 4,
    map: map
  });
  
  // Store reference for later toggle
  window.routePolylines = window.routePolylines || {};
  window.routePolylines[routeId] = polyline;
  
  // Add waypoint markers
  route.waypoints.forEach((waypoint, index) => {
    new google.maps.Marker({
      position: waypoint,
      map: map,
      label: {
        text: `${routeId.toUpperCase()}-${index + 1}`,
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: 'bold'
      },
      title: `${route.name} - Waypoint ${index + 1}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: route.color,
        fillOpacity: 0.9,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });
  });
  
  return polyline;
}

/**
 * Toggles route visibility on the map
 * @param {string} routeId - Route identifier
 * @param {boolean} visible - Show or hide
 */
function toggleRouteVisibility(routeId, visible) {
  const polyline = window.routePolylines[routeId];
  if (polyline) {
    polyline.setVisible(visible);
    console.log(`Route ${routeId} visibility: ${visible}`);
  }
}

// Initialize all routes on map load
function initializeAllRoutes(map) {
  Object.keys(routeData).forEach(routeId => {
    renderRoute(map, routeData[routeId], routeId);
  });
}
```

### 3.3 Visualization Layer (charts.js)

**Schritt 3: Charts mit neuer Route aktualisieren**

```javascript
// In assets/charts.js

/**
 * Updates route comparison chart with new route data
 * @param {Chart} chartInstance - Existing Chart.js instance
 * @param {Object} newRoute - New route data
 */
function addRouteToComparisonChart(chartInstance, newRoute) {
  // Add new route to radar chart
  chartInstance.data.datasets.push({
    label: newRoute.name,
    data: [
      newRoute.distance,
      newRoute.duration,
      100 - newRoute.noiseExposure,  // Inverted for better visualization
      100 - newRoute.energyConsumption,
      newRoute.taCompliance ? 100 : 0
    ],
    backgroundColor: `${newRoute.color}33`,  // 20% opacity
    borderColor: newRoute.color,
    borderWidth: 2
  });
  
  chartInstance.update();
}

/**
 * Creates route comparison table entry
 * @param {Object} route - Route data
 * @returns {HTMLElement} Table row element
 */
function createRouteTableRow(route) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="px-4 py-2">
      <span class="inline-block w-4 h-1" style="background-color: ${route.color}"></span>
      ${route.name}
    </td>
    <td class="px-4 py-2">${route.distance} km</td>
    <td class="px-4 py-2">${route.duration} min</td>
    <td class="px-4 py-2">${route.noiseExposure} dB</td>
    <td class="px-4 py-2">${route.energyConsumption}%</td>
    <td class="px-4 py-2">
      <span class="badge ${route.taCompliance ? 'badge-success' : 'badge-danger'}"
            role="status"
            aria-label="${route.taCompliance ? 'TA Lärm compliant' : 'TA Lärm non-compliant'}">
        ${route.taCompliance ? '✓ Konform' : '✗ Nicht konform'}
      </span>
    </td>
  `;
  return row;
}
```

### 3.4 UI Layer (index.html)

**Schritt 4: Toggle-Control hinzufügen**

```html
<!-- In index.html, innerhalb des Route-Controls Bereichs -->

<label class="flex items-center space-x-2 cursor-pointer">
  <input 
    type="checkbox" 
    id="toggleRouteD"
    checked
    class="w-4 h-4 text-purple-600 focus:ring-2 focus:ring-purple-500 rounded"
    aria-label="Toggle Route D weather alternative visibility"
    onchange="toggleRouteVisibility('route4', this.checked)">
  <span class="flex items-center">
    <span class="w-4 h-1 bg-purple-600 mr-2" aria-hidden="true"></span>
    <span id="routeDLabel">Route D (Wetteralternative)</span>
  </span>
</label>
```

### 3.5 Styling (styles.css)

**Schritt 5: CSS-Variablen für neue Route**

```css
/* In assets/styles.css */

:root {
  /* Existing colors... */
  --color-route-a: #3B82F6;  /* Blue */
  --color-route-b: #10B981;  /* Green */
  --color-route-c: #F59E0B;  /* Orange */
  
  /* NEW: Route D Color */
  --color-route-d: #8B5CF6;  /* Purple */
}

/* Route D specific styles */
.route-d-polyline {
  stroke: var(--color-route-d);
  stroke-width: 4px;
  stroke-opacity: 0.8;
}

.route-d-marker {
  background-color: var(--color-route-d);
  border: 2px solid white;
}

/* Badge styling */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
}

.badge-success {
  background-color: #10B981;
  color: white;
}

.badge-danger {
  background-color: #EF4444;
  color: white;
}
```

---

## 🌐 Phase 4: Internationalisierung

### 4.1 Übersetzungen hinzufügen

```javascript
// In assets/data.js oder separates i18n.js

const translations = {
  de: {
    // Existing translations...
    'route.d.name': 'Route D (Wetteralternative)',
    'route.d.description': 'Alternative Flugroute für schlechte Wetterbedingungen',
    'route.d.toggle': 'Route D Sichtbarkeit umschalten'
  },
  en: {
    // Existing translations...
    'route.d.name': 'Route D (Weather Alternative)',
    'route.d.description': 'Alternative flight route for bad weather conditions',
    'route.d.toggle': 'Toggle Route D visibility'
  }
};

/**
 * Translates a key to current language
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function translate(key) {
  const currentLang = document.getElementById('languageSelect').value || 'de';
  return translations[currentLang][key] || key;
}

/**
 * Updates all UI texts when language changes
 */
function updateLanguage() {
  document.getElementById('routeDLabel').textContent = translate('route.d.name');
  document.getElementById('toggleRouteD').setAttribute(
    'aria-label', 
    translate('route.d.toggle')
  );
  // Update other elements...
}
```

---

## ✅ Phase 5: Testing

### 5.1 Unit Tests

```javascript
/**
 * Test GPS coordinate validation
 */
function testGpsValidation() {
  // Test valid coordinates (6 decimals)
  console.assert(
    validateGpsCoordinates(51.371099, 7.693150) === true,
    'Valid GPS should pass'
  );
  
  // Test invalid coordinates (wrong precision)
  console.assert(
    validateGpsCoordinates(51.371, 7.693) === false,
    'GPS with <6 decimals should fail'
  );
  
  // Test out of range
  console.assert(
    validateGpsCoordinates(91, 7.693150) === false,
    'Latitude >90 should fail'
  );
}

/**
 * Test TA Lärm compliance
 */
function testTaLaermCompliance() {
  // Test compliant noise level
  console.assert(
    checkTaLaermCompliance(50, 'residential', 'day') === true,
    'Noise 50 dB in residential day should be compliant'
  );
  
  // Test non-compliant noise level
  console.assert(
    checkTaLaermCompliance(60, 'residential', 'day') === false,
    'Noise 60 dB in residential day should not be compliant'
  );
}
```

### 5.2 Functional Tests

**Manueller Test-Plan:**

1. **Route Visibility Toggle**
   - [ ] Checkbox aktivieren/deaktivieren
   - [ ] Route erscheint/verschwindet auf Karte
   - [ ] Waypoint-Marker werden korrekt angezeigt
   - [ ] Keine JavaScript-Errors in Console

2. **GPS Coordinates**
   - [ ] Alle Waypoints haben exakt 6 Dezimalstellen
   - [ ] Koordinaten liegen im gültigen Bereich
   - [ ] Route wird an korrekter Position angezeigt

3. **TA Lärm Compliance**
   - [ ] Compliance-Status korrekt berechnet
   - [ ] Badge zeigt richtigen Status (✓/✗)
   - [ ] Farbe entspricht Status (Grün/Rot)

4. **Charts**
   - [ ] Route erscheint in Vergleichstabelle
   - [ ] Radar-Chart zeigt neue Route
   - [ ] Historische Daten inkludiert

5. **Responsive Design**
   - [ ] Mobile (375px): Funktioniert einwandfrei
   - [ ] Tablet (768px): Layout passt sich an
   - [ ] Desktop (1920px): Optimale Darstellung

6. **Accessibility**
   - [ ] Keyboard: Tab-Navigation funktioniert
   - [ ] Screen Reader: Labels werden vorgelesen
   - [ ] Focus: Sichtbare Focus-Indicators
   - [ ] Kontrast: Alle Texte gut lesbar

7. **Internationalisierung**
   - [ ] DE: Alle Texte auf Deutsch
   - [ ] EN: Alle Texte auf Englisch
   - [ ] Language Toggle funktioniert

8. **Cross-Browser**
   - [ ] Chrome 100+: Voll funktionsfähig
   - [ ] Firefox 100+: Voll funktionsfähig
   - [ ] Safari 15+: Voll funktionsfähig
   - [ ] Edge 90+: Voll funktionsfähig

---

## 📚 Phase 6: Dokumentation

### 6.1 Code-Dokumentation (JSDoc)

**Alle neuen Funktionen müssen dokumentiert sein:**

```javascript
/**
 * Renders Route D (weather alternative) on the map
 * @param {google.maps.Map} map - Google Maps instance
 * @returns {google.maps.Polyline} The rendered polyline
 * @throws {Error} If GPS coordinates are invalid
 * @example
 * const routeD = renderRouteD(map);
 * routeD.setVisible(false);  // Hide route
 */
function renderRouteD(map) {
  return renderRoute(map, routeData.route4, 'route4');
}
```

### 6.2 README Updates

**Aktualisiere README.md:**

```markdown
### Routen

Das Dashboard visualisiert 4 alternative Drohnenrouten:

- **Route A (Blau)**: Optimierte Hauptroute
- **Route B (Grün)**: Lärmminimierte Route
- **Route C (Orange)**: Kürzeste Route
- **Route D (Lila)**: Wetteralternativroute (NEU)

Alle Routen können einzeln ein-/ausgeblendet werden.
```

### 6.3 AGENTS.md Updates

**Bei strukturellen Änderungen AGENTS.md aktualisieren:**

```markdown
## Neue Routen hinzufügen

1. Route-Daten in `assets/data.js` definieren
2. GPS-Koordinaten validieren (6 Dezimalstellen!)
3. Route in `assets/maps.js` rendern
4. Charts in `assets/charts.js` aktualisieren
5. Toggle-Control in `index.html` hinzufügen
6. Farbe in `assets/styles.css` definieren
7. Übersetzungen hinzufügen (DE/EN)
8. Vollständig testen
```

---

## 🎯 Checkliste: Feature Completion

### Implementation
- [ ] Datenstrukturen definiert und validiert
- [ ] GPS-Koordinaten haben 6 Dezimalstellen
- [ ] TA Lärm Compliance berechnet
- [ ] UI-Komponenten implementiert
- [ ] Google Maps Integration funktioniert
- [ ] Charts aktualisiert

### Quality
- [ ] JSDoc für alle neuen Funktionen
- [ ] Keine hardcodierten Secrets
- [ ] Airbnb Style Guide eingehalten
- [ ] Code Review durchgeführt
- [ ] Keine Console-Errors

### Accessibility
- [ ] WCAG 2.1 AA erfüllt
- [ ] Semantic HTML verwendet
- [ ] ARIA Labels vorhanden
- [ ] Keyboard Navigation funktioniert
- [ ] Screen Reader kompatibel
- [ ] Kontraste ausreichend (≥4.5:1)

### Testing
- [ ] Unit Tests bestanden
- [ ] Functional Tests bestanden
- [ ] Responsive getestet (Mobile, Tablet, Desktop)
- [ ] Cross-Browser getestet (Chrome, Firefox, Safari, Edge)
- [ ] Performance OK (Lighthouse Score >90)

### Documentation
- [ ] JSDoc vollständig
- [ ] README.md aktualisiert
- [ ] AGENTS.md aktualisiert (falls nötig)
- [ ] Inline-Kommentare hilfreich

### Internationalization
- [ ] Deutsche Übersetzungen (DE)
- [ ] Englische Übersetzungen (EN)
- [ ] Language Toggle getestet

---

## 📚 Referenzen

- **[AGENTS.md](../../AGENTS.md)**: Detaillierte Entwicklungsrichtlinien
- **[copilot-instructions.md](../copilot-instructions.md)**: Coding Standards
- **[code-review.md](code-review.md)**: Review-Checkliste
- **[Google Maps API Docs](https://developers.google.com/maps/documentation/javascript)**: API-Referenz
- **[Chart.js Docs](https://www.chartjs.org/docs/latest/)**: Chart-Konfiguration
- **[WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)**: Accessibility Guidelines

---

**Feature Development Complete!** 🎉

Stelle sicher, dass alle Checkboxen markiert sind, bevor du einen Pull Request erstellst.
