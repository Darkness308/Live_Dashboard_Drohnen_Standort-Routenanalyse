# Bug Fix Prompt - MORPHEUS Dashboard

> Systematic debugging and bug-fixing approach for MORPHEUS Drohnen-Dashboard

## 🐛 Bug-Fixing Framework

Dieser Prompt führt dich durch einen strukturierten Prozess zur Identifikation, Analyse und Behebung von Bugs im MORPHEUS Dashboard.

---

## 📋 Phase 1: Problem-Identifikation

### 1.1 Bug-Report erfassen

**Sammle folgende Informationen:**

| Information | Details |
|------------|---------|
| **Bug-Titel** | Kurze, präzise Beschreibung |
| **Symptome** | Was funktioniert nicht? |
| **Erwartetes Verhalten** | Was sollte passieren? |
| **Tatsächliches Verhalten** | Was passiert stattdessen? |
| **Reproduzierbarkeit** | Immer / Manchmal / Einmalig |
| **Browser** | Chrome / Firefox / Safari / Edge + Version |
| **Device** | Desktop / Tablet / Mobile + Screen Size |
| **Error Messages** | Console Errors, Stack Traces |

**Beispiel:**
```
Titel: GPS-Koordinaten werden mit falscher Präzision angezeigt
Symptome: Marker erscheinen an falschen Positionen auf der Karte
Erwartet: Marker bei exakten GPS-Koordinaten (6 Dezimalstellen)
Tatsächlich: Marker sind verschoben, Koordinaten haben nur 3 Dezimalstellen
Reproduzierbarkeit: Immer bei Route B
Browser: Chrome 120.0.6099.109
Device: Desktop 1920x1080
Error: "GPS validation failed: lat=51.371 (3 decimals)"
```

### 1.2 Reproduktionsschritte dokumentieren

**Schritt-für-Schritt Anleitung:**

1. [Öffne das Dashboard]
2. [Führe Aktion X aus]
3. [Beobachte Ergebnis Y]
4. [Erwartetes Ergebnis: Z]

**Beispiel:**
```
1. Öffne http://localhost:8000
2. Wähle "Route B" aus dem Dropdown
3. Klicke auf Waypoint-Marker
4. Beobachte Info-Window mit GPS-Koordinaten
5. Erwartete Koordinaten: 51.371099, 7.693150
6. Tatsächliche Koordinaten: 51.371, 7.693
```

### 1.3 Browser-Console analysieren

**Suche nach:**
- ❌ **Errors** (rot): Kritische Fehler
- ⚠️ **Warnings** (gelb): Potenzielle Probleme
- ℹ️ **Info** (blau): Debug-Informationen

**Wichtige Error-Patterns:**
```javascript
// Google Maps API Errors
"Google Maps API error: InvalidKeyMapError"
"Failed to load Google Maps API"

// GPS Validation Errors
"GPS validation failed: lat=X (N decimals)"
"GPS out of range: lat=X, lng=Y"

// Chart.js Errors
"Cannot read property 'data' of undefined"
"Chart.js: Invalid data format"

// Accessibility Errors
"Missing aria-label on element"
"Invalid ARIA attribute"
```

---

## 🔍 Phase 2: Root Cause Analysis

### 2.1 GPS-Koordinaten-Fehler

**Häufige Ursachen:**

#### Problem: Zu wenige Dezimalstellen
```javascript
// ❌ FEHLER: Nur 3 Dezimalstellen
const waypoint = { lat: 51.371, lng: 7.693 };

// ✅ FIX: Exakt 6 Dezimalstellen
const waypoint = { lat: 51.371099, lng: 7.693150 };
```

**Debug-Strategie:**
1. Console-Log alle GPS-Koordinaten vor Verwendung
2. Prüfe Datenquelle (data.js)
3. Validiere mit `validateGpsCoordinates()`
4. Tracke Koordinaten-Transformationen

```javascript
/**
 * Debug GPS coordinates throughout pipeline
 */
function debugGpsCoordinates(label, lat, lng) {
  const latDecimals = (lat.toString().split('.')[1] || '').length;
  const lngDecimals = (lng.toString().split('.')[1] || '').length;
  
  console.log(`[GPS Debug] ${label}:`, {
    lat: lat,
    lng: lng,
    latDecimals: latDecimals,
    lngDecimals: lngDecimals,
    valid: latDecimals === 6 && lngDecimals === 6
  });
}

// Verwendung
debugGpsCoordinates('Route B Waypoint 1', 51.371099, 7.693150);
```

#### Problem: Koordinaten außerhalb gültigen Bereichs
```javascript
// ❌ FEHLER: Latitude >90
const waypoint = { lat: 91.371099, lng: 7.693150 };

// ✅ FIX: Überprüfe Bereich
if (lat < -90 || lat > 90) {
  throw new Error(`Latitude out of range: ${lat} (must be -90 to 90)`);
}
if (lng < -180 || lng > 180) {
  throw new Error(`Longitude out of range: ${lng} (must be -180 to 180)`);
}
```

### 2.2 Map-Rendering-Probleme

**Symptom: Karte lädt nicht**

**Mögliche Ursachen:**

#### 1. Fehlender/Ungültiger API-Key
```javascript
// Debug: API-Key Validierung
function debugGoogleMapsApiKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  console.log('[Maps Debug] API Key Status:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWithCorrect: apiKey?.startsWith('AIzaSy') || false,
    isPlaceholder: apiKey === 'your_google_maps_api_key_here'
  });
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    console.error('[Maps Debug] Invalid API key detected!');
    return false;
  }
  
  return true;
}
```

#### 2. Script lädt nicht
```javascript
// Debug: Script-Ladestatus prüfen
function debugGoogleMapsScript() {
  const script = document.querySelector('script[src*="maps.googleapis.com"]');
  
  console.log('[Maps Debug] Script Status:', {
    exists: !!script,
    src: script?.src || 'N/A',
    loaded: typeof google !== 'undefined' && typeof google.maps !== 'undefined'
  });
  
  if (script) {
    script.addEventListener('error', (e) => {
      console.error('[Maps Debug] Script failed to load:', e);
    });
    
    script.addEventListener('load', () => {
      console.log('[Maps Debug] Script loaded successfully');
    });
  }
}
```

#### 3. Container hat keine Höhe
```html
<!-- ❌ FEHLER: Container ohne Höhe -->
<div id="map"></div>

<!-- ✅ FIX: Explizite Höhe setzen -->
<div id="map" style="width: 100%; height: 600px;"></div>

<style>
#map {
  width: 100%;
  height: 600px;
  min-height: 400px;
}
</style>
```

### 2.3 Chart-Display-Issues

**Symptom: Charts werden nicht angezeigt**

**Debugging:**
```javascript
/**
 * Debug Chart.js initialization
 */
function debugChartInitialization(canvasId) {
  const canvas = document.getElementById(canvasId);
  
  console.log(`[Chart Debug] ${canvasId}:`, {
    canvasExists: !!canvas,
    canvasType: canvas?.tagName || 'N/A',
    hasContext: !!canvas?.getContext('2d'),
    chartJsLoaded: typeof Chart !== 'undefined',
    dimensions: canvas ? {
      width: canvas.width,
      height: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight
    } : null
  });
  
  if (!canvas) {
    console.error(`[Chart Debug] Canvas #${canvasId} not found!`);
    return false;
  }
  
  if (!canvas.getContext('2d')) {
    console.error(`[Chart Debug] Canvas #${canvasId} doesn't support 2D context!`);
    return false;
  }
  
  return true;
}
```

**Häufige Chart-Fehler:**

#### 1. Falsche Datenstruktur
```javascript
// ❌ FEHLER: Unvollständige Daten
const chartData = {
  labels: ['Route A', 'Route B'],
  datasets: [{
    data: [10, 20, 30]  // Mehr Datenpunkte als Labels!
  }]
};

// ✅ FIX: Labels und Daten abgleichen
const chartData = {
  labels: ['Route A', 'Route B', 'Route C'],
  datasets: [{
    label: 'Distanz (km)',
    data: [10, 20, 30]
  }]
};
```

#### 2. Canvas-Element fehlt
```javascript
// ✅ FIX: Element-Existenz prüfen
function createChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  
  if (!canvas) {
    console.error(`Cannot create chart: Canvas #${canvasId} not found`);
    return null;
  }
  
  try {
    return new Chart(canvas, config);
  } catch (error) {
    console.error(`Chart creation failed for #${canvasId}:`, error);
    return null;
  }
}
```

### 2.4 Accessibility-Violations

**Symptom: Screen Reader funktioniert nicht korrekt**

**Prüfe:**

#### 1. Fehlende ARIA Labels
```html
<!-- ❌ FEHLER: Kein aria-label -->
<button onclick="toggleHeatmap()">Toggle</button>

<!-- ✅ FIX: aria-label hinzufügen -->
<button 
  onclick="toggleHeatmap()" 
  aria-label="Toggle noise heatmap visibility"
  aria-pressed="false">
  Toggle Heatmap
</button>
```

#### 2. Nicht-semantisches HTML
```html
<!-- ❌ FEHLER: div als Button -->
<div onclick="submitForm()" class="btn">Submit</div>

<!-- ✅ FIX: Echten Button verwenden -->
<button onclick="submitForm()" class="btn">Submit</button>
```

#### 3. Fehlende Focus-Indicators
```css
/* ❌ FEHLER: Focus entfernt */
*:focus {
  outline: none;
}

/* ✅ FIX: Sichtbaren Focus-State -->
button:focus,
a:focus,
input:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Für Custom-Komponenten */
.custom-button:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

### 2.5 Cross-Browser-Kompatibilität

**Symptom: Funktioniert in Chrome, aber nicht in Safari**

**Prüfe Browser-spezifische Features:**

```javascript
// ❌ PROBLEMATISCH: Optional Chaining (Safari <13.1)
const value = obj?.nested?.value;

// ✅ FIX: Mit Fallback
const value = obj && obj.nested && obj.nested.value;

// ❌ PROBLEMATISCH: Nullish Coalescing (Safari <13.1)
const value = input ?? defaultValue;

// ✅ FIX: Mit Alternative
const value = input !== null && input !== undefined ? input : defaultValue;
```

**CSS Browser-Compatibility:**
```css
/* ❌ PROBLEMATISCH: Grid ohne Fallback */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

/* ✅ FIX: Mit Flexbox-Fallback */
.container {
  display: flex;
  flex-wrap: wrap;
}

@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🔧 Phase 3: Bug-Fixing

### 3.1 Isoliere das Problem

**Strategie:**
1. **Binary Search**: Halbiere den Code, finde betroffenen Bereich
2. **Console Logging**: Tracke Datenfluß
3. **Breakpoints**: Debugger in Browser DevTools
4. **Unit Tests**: Teste einzelne Funktionen isoliert

**Beispiel: GPS-Bug isolieren**
```javascript
// Schritt 1: Prüfe Datenquelle
console.log('[1] Raw data:', routeData.route2.waypoints);

// Schritt 2: Prüfe nach Validierung
routeData.route2.waypoints.forEach((wp, i) => {
  const valid = validateGpsCoordinates(wp.lat, wp.lng);
  console.log(`[2] Waypoint ${i}:`, wp, 'valid:', valid);
});

// Schritt 3: Prüfe bei Marker-Erstellung
function createMarker(position, index) {
  console.log(`[3] Creating marker ${index}:`, position);
  const marker = new google.maps.Marker({ position });
  console.log(`[3] Marker created:`, marker.getPosition());
  return marker;
}
```

### 3.2 Implementiere den Fix

**Beispiel 1: GPS-Präzision korrigieren**

```javascript
// VORHER (Bug):
const waypoints = [
  { lat: 51.371, lng: 7.693 },  // Nur 3 Dezimalstellen
  { lat: 51.375, lng: 7.698 }
];

// NACHHER (Fix):
const waypoints = [
  { lat: 51.371099, lng: 7.693150 },  // Exakt 6 Dezimalstellen
  { lat: 51.375421, lng: 7.698234 }
];

// Validierung hinzufügen:
waypoints.forEach((wp, index) => {
  if (!validateGpsCoordinates(wp.lat, wp.lng)) {
    throw new Error(
      `Invalid GPS at waypoint ${index}: ` +
      `lat=${wp.lat}, lng=${wp.lng} ` +
      `(requires exactly 6 decimal places)`
    );
  }
});
```

**Beispiel 2: API-Key Sicherheit**

```javascript
// VORHER (Bug):
const apiKey = 'AIzaSyC...hardcoded_key';  // Sicherheitsrisiko!

// NACHHER (Fix):
function loadApiKey() {
  // Versuche aus verschiedenen Quellen
  let apiKey = process.env.GOOGLE_MAPS_API_KEY ||
               localStorage.getItem('GOOGLE_MAPS_API_KEY') ||
               null;
  
  // Validierung
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    console.error('No valid Google Maps API key found');
    throw new Error(
      'Please configure your Google Maps API key in .env file'
    );
  }
  
  // Zusätzliche Validierung
  if (!apiKey.startsWith('AIzaSy')) {
    console.error('Invalid API key format');
    throw new Error('Google Maps API key must start with "AIzaSy"');
  }
  
  return apiKey;
}

const apiKey = loadApiKey();
```

**Beispiel 3: Accessibility Fix**

```html
<!-- VORHER (Bug): -->
<div onclick="toggleRoute('A')" class="route-toggle">
  Route A
</div>

<!-- NACHHER (Fix): -->
<button 
  id="toggleRouteA"
  class="route-toggle"
  aria-label="Toggle Route A visibility"
  aria-pressed="false"
  onclick="toggleRoute('A', this)">
  <span class="route-indicator" style="background-color: #3B82F6" aria-hidden="true"></span>
  <span>Route A (Optimiert)</span>
</button>

<script>
function toggleRoute(routeId, button) {
  const isVisible = !routePolylines[routeId].getVisible();
  routePolylines[routeId].setVisible(isVisible);
  
  // Update ARIA state
  button.setAttribute('aria-pressed', isVisible.toString());
  
  // Announce to screen readers
  const message = `Route ${routeId} ${isVisible ? 'visible' : 'hidden'}`;
  announceToScreenReader(message);
}

/**
 * Announces message to screen readers using aria-live
 */
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('sr-announcements') ||
                     createLiveRegion();
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => { liveRegion.textContent = ''; }, 1000);
}

function createLiveRegion() {
  const region = document.createElement('div');
  region.id = 'sr-announcements';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  return region;
}
</script>

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

### 3.3 Schreibe Regression-Tests

**Verhindern, dass Bug wiederkommt:**

```javascript
/**
 * Regression test for GPS precision bug
 */
function testGpsPrecisionRegression() {
  const testCases = [
    { lat: 51.371099, lng: 7.693150, expected: true },
    { lat: 51.371, lng: 7.693, expected: false },
    { lat: 51.3710991, lng: 7.6931501, expected: false }
  ];
  
  testCases.forEach((testCase, index) => {
    const result = validateGpsCoordinates(testCase.lat, testCase.lng);
    console.assert(
      result === testCase.expected,
      `Test ${index + 1} failed: lat=${testCase.lat}, lng=${testCase.lng}, ` +
      `expected=${testCase.expected}, got=${result}`
    );
  });
  
  console.log('GPS precision regression tests passed ✓');
}

/**
 * Regression test for API key security
 */
function testApiKeySecurityRegression() {
  const testCases = [
    { key: null, shouldFail: true },
    { key: '', shouldFail: true },
    { key: 'your_google_maps_api_key_here', shouldFail: true },
    { key: 'AIzaSyC...', shouldFail: false },
    { key: 'InvalidKey', shouldFail: true }
  ];
  
  testCases.forEach((testCase, index) => {
    try {
      validateApiKey(testCase.key);
      console.assert(
        !testCase.shouldFail,
        `Test ${index + 1} should have failed but passed`
      );
    } catch (error) {
      console.assert(
        testCase.shouldFail,
        `Test ${index + 1} should have passed but failed`
      );
    }
  });
  
  console.log('API key security regression tests passed ✓');
}

// Run all regression tests
function runRegressionTests() {
  console.log('Running regression tests...');
  testGpsPrecisionRegression();
  testApiKeySecurityRegression();
  console.log('All regression tests passed ✓');
}
```

---

## ✅ Phase 4: Verification

### 4.1 Funktionale Verifikation

**Checkliste:**
- [ ] Bug ist vollständig behoben
- [ ] Keine neuen Bugs eingeführt
- [ ] Reproduktionsschritte funktionieren jetzt korrekt
- [ ] Edge Cases getestet
- [ ] Error Messages hilfreich und klar

### 4.2 Cross-Browser Testing

**Teste auf:**
- [ ] Chrome 100+ (Desktop & Mobile)
- [ ] Firefox 100+ (Desktop & Mobile)
- [ ] Safari 15+ (Desktop & iOS)
- [ ] Edge 90+ (Desktop)

### 4.3 Accessibility Verification

**Prüfe:**
- [ ] Keyboard Navigation funktioniert
- [ ] Screen Reader liest korrekt vor
- [ ] Focus-Indicators sichtbar
- [ ] ARIA-States korrekt
- [ ] Kontraste ausreichend

### 4.4 Performance Check

**Stelle sicher:**
- [ ] Keine Performance-Regression
- [ ] Lighthouse Score unverändert (>90)
- [ ] Keine Memory Leaks
- [ ] Console sauber (keine Errors/Warnings)

---

## 📝 Phase 5: Dokumentation

### 5.1 Bug-Fix dokumentieren

**Commit Message:**
```
fix: Correct GPS coordinate precision for Route B waypoints

- Changed waypoint coordinates to exactly 6 decimal places
- Added GPS validation before marker creation
- Updated data.js with correct coordinates
- Added regression test for GPS precision

Fixes #123
```

### 5.2 Code-Kommentare

```javascript
/**
 * Fixed Bug #123: GPS coordinates must have exactly 6 decimal places
 * 
 * Previous implementation used only 3 decimals, causing marker misplacement.
 * Now validates all coordinates before rendering.
 * 
 * @see https://github.com/Darkness308/Live_Dashboard.../issues/123
 */
function renderWaypoint(lat, lng) {
  // Validate GPS precision (Bug #123 fix)
  if (!validateGpsCoordinates(lat, lng)) {
    throw new Error(
      `GPS validation failed: lat=${lat}, lng=${lng}. ` +
      `Coordinates must have exactly 6 decimal places.`
    );
  }
  
  // Rest of implementation...
}
```

### 5.3 Update CHANGELOG

```markdown
## [1.0.1] - 2025-12-01

### Fixed
- GPS coordinate precision for Route B waypoints (#123)
- API key security vulnerability (#124)
- Accessibility issue with route toggle buttons (#125)
- Chart rendering on Safari 15 (#126)
```

---

## 🚨 Häufige Bug-Kategorien

### 1. GPS-Koordinaten Bugs
- ✅ **Symptom**: Marker an falscher Position
- ✅ **Ursache**: Falsche Dezimalstellen-Anzahl
- ✅ **Fix**: Auf exakt 6 Dezimalstellen korrigieren
- ✅ **Prevention**: Validierung vor Rendering

### 2. API-Key Bugs
- ✅ **Symptom**: Karte lädt nicht
- ✅ **Ursache**: Fehlender/ungültiger API-Key
- ✅ **Fix**: API-Key aus .env laden
- ✅ **Prevention**: Startup-Validierung implementieren

### 3. Chart-Rendering Bugs
- ✅ **Symptom**: Charts nicht sichtbar
- ✅ **Ursache**: Falsche Datenstruktur, fehlendes Canvas
- ✅ **Fix**: Daten validieren, Element-Existenz prüfen
- ✅ **Prevention**: Defensive Programmierung

### 4. Accessibility Bugs
- ✅ **Symptom**: Screen Reader funktioniert nicht
- ✅ **Ursache**: Fehlende ARIA-Labels
- ✅ **Fix**: Semantic HTML, ARIA-Attribute hinzufügen
- ✅ **Prevention**: Accessibility-Tests in CI/CD

### 5. Responsive Design Bugs
- ✅ **Symptom**: Layout bricht auf Mobile
- ✅ **Ursache**: Fehlende Media Queries
- ✅ **Fix**: Mobile First CSS
- ✅ **Prevention**: Responsive Testing ab 320px

---

## 📚 Debugging-Tools

### Browser DevTools
- **Chrome DevTools**: Elements, Console, Network, Performance
- **Firefox Developer Tools**: Inspector, Debugger, Network Monitor
- **Safari Web Inspector**: Elements, Console, Network

### Accessibility Tools
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Comprehensive audits

### Code Quality Tools
- **ESLint**: JavaScript linting
- **Stylelint**: CSS linting
- **Prettier**: Code formatting

---

## 📚 Referenzen

- **[AGENTS.md](../../AGENTS.md)**: Entwicklungsrichtlinien
- **[copilot-instructions.md](../copilot-instructions.md)**: Coding Standards
- **[Chrome DevTools](https://developer.chrome.com/docs/devtools/)**: Debugging Guide
- **[MDN Web Docs](https://developer.mozilla.org/)**: Web Platform Reference

---

**Bug Fixed!** ✅ 

Stelle sicher, dass alle Verifikationsschritte durchgeführt wurden und die Dokumentation aktualisiert ist.
