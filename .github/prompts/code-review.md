# Code Review Prompt - MORPHEUS Dashboard

> Systematic code review checklist for MORPHEUS Drohnen-Dashboard

## 📋 Review-Auftrag

Führe einen umfassenden Code-Review durch für den MORPHEUS Drohnen-Standort & Routenanalyse Dashboard. Konzentriere dich auf Code-Qualität, Sicherheit, Accessibility und Regulatory Compliance.

---

## 🔍 Review-Kategorien

### 1. Airbnb JavaScript Style Guide Compliance

**Prüfe:**
- [ ] Verwendung von `const` und `let` (niemals `var`)
- [ ] Arrow Functions für Callbacks
- [ ] Template Literals für String-Interpolation
- [ ] Destructuring für Objekte und Arrays
- [ ] Konsistente Einrückung (2 Leerzeichen)
- [ ] Semikolons am Ende von Statements
- [ ] Single Quotes für Strings
- [ ] Trailing Commas in Multi-Line Arrays/Objects

**Beispiel:**
```javascript
// ✅ RICHTIG
const getFleetStatus = () => {
  const { total, active, charging } = fleetData;
  return `Fleet: ${active}/${total} active`;
};

// ❌ FALSCH
var getFleetStatus = function() {
  var total = fleetData.total
  var active = fleetData.active
  var charging = fleetData.charging
  return "Fleet: " + active + "/" + total + " active"
}
```

---

### 2. GPS-Koordinaten Validierung

**Kritisch:** Alle GPS-Koordinaten MÜSSEN genau 6 Dezimalstellen haben

**Prüfe:**
- [ ] Alle `lat` Werte haben 6 Dezimalstellen (z.B. `51.371099`)
- [ ] Alle `lng` Werte haben 6 Dezimalstellen (z.B. `7.693150`)
- [ ] Koordinaten liegen im gültigen Bereich (`lat: -90 bis 90, lng: -180 bis 180`)
- [ ] Validierung vor Rendering erfolgt

**Test-Code:**
```javascript
/**
 * Validates GPS coordinates for required precision
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Validation result
 */
function validateGpsCoordinates(lat, lng) {
  const latDecimals = (lat.toString().split('.')[1] || '').length;
  const lngDecimals = (lng.toString().split('.')[1] || '').length;
  
  if (latDecimals !== 6 || lngDecimals !== 6) {
    console.error(`GPS precision error: lat=${lat} (${latDecimals} decimals), lng=${lng} (${lngDecimals} decimals)`);
    return false;
  }
  
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.error(`GPS out of range: lat=${lat}, lng=${lng}`);
    return false;
  }
  
  return true;
}
```

**Häufige Fehler:**
```javascript
// ❌ FALSCH: Zu wenige Dezimalstellen
{ lat: 51.371, lng: 7.693 }

// ❌ FALSCH: Zu viele Dezimalstellen
{ lat: 51.3710991, lng: 7.6931501 }

// ✅ RICHTIG: Exakt 6 Dezimalstellen
{ lat: 51.371099, lng: 7.693150 }
```

---

### 3. API-Key Sicherheit

**Kritisch:** KEINE hardcodierten API-Keys im Code

**Prüfe:**
- [ ] Keine API-Keys direkt im Code
- [ ] API-Keys aus `.env` oder Environment-Variablen
- [ ] `.env` in `.gitignore` enthalten
- [ ] `.env.example` mit Platzhaltern vorhanden
- [ ] Keine Credentials in Commit-History

**Sichere Implementierung:**
```javascript
// ✅ RICHTIG: API-Key aus Environment
const loadGoogleMapsApi = () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 
                 localStorage.getItem('GOOGLE_MAPS_API_KEY');
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error('Valid Google Maps API key required. Configure in .env file.');
  }
  
  return loadApiScript(apiKey);
};

// ❌ FALSCH: Hardcodierter API-Key
const apiKey = 'AIzaSyC...actual_key_here';
```

**Scanne nach:**
- Patterns wie `AIzaSy`, `sk_`, `pk_`, `token`, `secret`
- Verdächtige Strings mit 32+ Zeichen
- Base64-encodierte Secrets

---

### 4. WCAG 2.1 AA Accessibility

**Pflicht:** Alle Features müssen WCAG 2.1 AA erfüllen

**Prüfe:**

#### 4.1 Semantic HTML
- [ ] Korrekte Verwendung von `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`
- [ ] Heading-Hierarchie logisch (`<h1>` → `<h2>` → `<h3>`)
- [ ] Listen mit `<ul>`, `<ol>`, `<li>`
- [ ] Buttons als `<button>`, nicht `<div onclick>`

```html
<!-- ✅ RICHTIG -->
<button id="toggleHeatmap" aria-label="Toggle noise heatmap">
  Toggle Heatmap
</button>

<!-- ❌ FALSCH -->
<div onclick="toggleHeatmap()">Toggle</div>
```

#### 4.2 ARIA Labels
- [ ] Alle interaktiven Elemente haben `aria-label` oder `aria-labelledby`
- [ ] Komplexe Widgets haben `role` Attribute
- [ ] Status-Updates verwenden `aria-live`
- [ ] Toggle-Buttons haben `aria-pressed`

```html
<!-- ✅ RICHTIG -->
<div 
  id="map" 
  role="application" 
  aria-label="Interactive map showing drone routes and noise measurement points"
  tabindex="0">
</div>
```

#### 4.3 Keyboard Navigation
- [ ] Alle Funktionen ohne Maus erreichbar
- [ ] Logische Tab-Order (tabindex wenn nötig)
- [ ] Sichtbare Focus-Indicators
- [ ] Skip Links vorhanden

```css
/* ✅ RICHTIG: Sichtbare Focus-States */
button:focus,
a:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* ❌ FALSCH: Focus entfernen */
*:focus {
  outline: none;
}
```

#### 4.4 Kontrastverhältnisse
- [ ] Normaler Text: ≥4.5:1
- [ ] Großer Text (18pt+): ≥3:1
- [ ] UI-Komponenten: ≥3:1

**Tools:**
- Chrome DevTools Lighthouse
- axe DevTools
- WebAIM Contrast Checker

---

### 5. TA Lärm Grenzwert-Validierung

**Kritisch:** Grenzwerte MÜSSEN gegen offizielle Quellen validiert sein

**Prüfe:**
- [ ] Grenzwerte entsprechen TA Lärm 1998
- [ ] Quellenangaben in Kommentaren
- [ ] Korrekte Zuordnung Tag/Nacht
- [ ] Gebietstypen richtig kategorisiert

**Offizielle Grenzwerte:**
```javascript
// [Quelle: TA Lärm 1998 - https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm]
const TA_LAERM_GRENZWERT = {
  WOHNGEBIET_TAG: 55,      // Nr. 6.1 a) Wohngebiete, Tag 06:00-22:00
  WOHNGEBIET_NACHT: 40,    // Nr. 6.1 a) Wohngebiete, Nacht 22:00-06:00
  GEWERBE_TAG: 65,         // Nr. 6.1 e) Gewerbegebiete, Tag
  GEWERBE_NACHT: 50,       // Nr. 6.1 e) Gewerbegebiete, Nacht
  INDUSTRIE_TAG: 70,       // Nr. 6.1 f) Industriegebiete, Tag
  INDUSTRIE_NACHT: 70      // Nr. 6.1 f) Industriegebiete, Nacht
};
```

**Compliance-Check:**
```javascript
/**
 * Checks TA Lärm compliance
 * @param {number} noiseLevel - Measured noise in dB(A)
 * @param {string} areaType - 'residential', 'commercial', 'industrial'
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
  if (!limit) {
    throw new Error(`Invalid area type or time: ${areaType}, ${timeOfDay}`);
  }
  
  return noiseLevel <= limit;
}
```

---

### 6. JSDoc-Dokumentation

**Pflicht:** Alle Funktionen benötigen JSDoc-Kommentare

**Prüfe:**
- [ ] Funktionsbeschreibung vorhanden
- [ ] Alle Parameter dokumentiert (`@param`)
- [ ] Rückgabewert dokumentiert (`@returns`)
- [ ] Exceptions dokumentiert (`@throws`)
- [ ] Beispiele bei komplexen Funktionen (`@example`)

**Beispiel:**
```javascript
/**
 * Renders a route polyline on the Google Map
 * @param {google.maps.Map} map - The map instance
 * @param {Object} route - Route data object
 * @param {string} route.name - Route name
 * @param {string} route.color - Hex color code
 * @param {Array<{lat: number, lng: number}>} route.waypoints - Route waypoints
 * @returns {google.maps.Polyline} The created polyline
 * @throws {Error} If map is not initialized or waypoints are invalid
 * @example
 * const polyline = renderRoute(map, {
 *   name: "Route A",
 *   color: "#3B82F6",
 *   waypoints: [{lat: 51.371099, lng: 7.693150}]
 * });
 */
function renderRoute(map, route) {
  if (!map || !google.maps) {
    throw new Error('Map not initialized');
  }
  
  // Validate waypoints
  route.waypoints.forEach(wp => {
    if (!validateGpsCoordinates(wp.lat, wp.lng)) {
      throw new Error(`Invalid waypoint: ${JSON.stringify(wp)}`);
    }
  });
  
  return new google.maps.Polyline({
    path: route.waypoints,
    geodesic: true,
    strokeColor: route.color,
    strokeOpacity: 0.8,
    strokeWeight: 4,
    map: map
  });
}
```

---

### 7. Responsive Design

**Pflicht:** Mobile First Design ab 320px

**Prüfe:**
- [ ] Mobile (320px - 767px): Single column layout
- [ ] Tablet (768px - 1023px): Two column layout
- [ ] Desktop (1024px+): Multi-column layout
- [ ] Touch-friendly targets (min 44x44px)
- [ ] Viewport meta tag vorhanden

**Breakpoints:**
```css
/* Mobile First Approach */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}
```

**Test auf:**
- iPhone SE (375px)
- iPad (768px)
- Desktop (1920px)

---

### 8. Browser-Kompatibilität

**Mindest-Unterstützung:**
- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 90+

**Prüfe:**
- [ ] Keine experimentellen CSS-Features ohne Fallback
- [ ] ES6+ Features werden von Zielbrowsern unterstützt
- [ ] Vendor-Präfixe wo nötig
- [ ] Polyfills für ältere Browser (falls erforderlich)

**Häufige Kompatibilitätsprobleme:**
```javascript
// ❌ PROBLEMATISCH: Optional Chaining in älteren Browsern
const value = obj?.nested?.value;

// ✅ SICHER: Mit Fallback
const value = obj && obj.nested && obj.nested.value;

// ODER: Mit nullish coalescing
const value = obj?.nested?.value ?? defaultValue;
```

---

## 🎯 Review-Prozess

### Schritt 1: Automatische Checks
```bash
# ESLint mit Airbnb Config
npx eslint assets/*.js

# HTML Validation
npx html-validate index.html

# CSS Linting
npx stylelint assets/styles.css

# GPS Coordinate Check (Custom Script)
node scripts/validate-gps.js

# Secret Scanner
npx secretlint "**/*"
```

### Schritt 2: Manuelle Überprüfung
1. **Code lesen**: Logik und Algorithmen verstehen
2. **Dokumentation prüfen**: JSDoc vollständig?
3. **Edge Cases testen**: Was passiert bei ungültigen Inputs?
4. **Performance analysieren**: Bottlenecks identifizieren
5. **Security Review**: Injection-Risks, XSS-Vulnerabilities

### Schritt 3: Funktionale Tests
1. **Google Maps laden**: API-Key funktioniert?
2. **Routen rendern**: Alle 3 Routen sichtbar?
3. **Charts anzeigen**: Daten korrekt visualisiert?
4. **Language Toggle**: DE/EN Wechsel funktioniert?
5. **Responsive testen**: Mobile, Tablet, Desktop

### Schritt 4: Accessibility Tests
1. **Keyboard Navigation**: Alle Features erreichbar?
2. **Screen Reader**: NVDA/JAWS Test
3. **Contrast Check**: Alle Texte lesbar?
4. **Zoom Test**: 200% Text-Skalierung OK?

---

## ✅ Review-Checkliste

### Code-Qualität
- [ ] Airbnb JavaScript Style Guide eingehalten
- [ ] JSDoc für alle Funktionen vorhanden
- [ ] Keine `console.log` Statements (außer Error-Handling)
- [ ] Keine toten Code-Pfade
- [ ] Keine unnötigen Kommentare

### Sicherheit
- [ ] Keine hardcodierten API-Keys
- [ ] Keine Secrets in `.env` committed
- [ ] Input-Validierung vorhanden
- [ ] XSS-Prevention implementiert
- [ ] CORS richtig konfiguriert

### Datenintegrität
- [ ] GPS-Koordinaten haben 6 Dezimalstellen
- [ ] TA Lärm Grenzwerte validiert
- [ ] Datentypen konsistent
- [ ] Keine Magic Numbers (Konstanten verwenden)

### Accessibility
- [ ] WCAG 2.1 AA erfüllt
- [ ] Semantic HTML verwendet
- [ ] ARIA Labels vorhanden
- [ ] Keyboard Navigation funktioniert
- [ ] Kontraste ausreichend

### Performance
- [ ] Keine unnötigen Re-Renders
- [ ] Events debounced/throttled
- [ ] Assets optimiert (Images, Scripts)
- [ ] Lazy Loading wo möglich

### Documentation
- [ ] README.md aktuell
- [ ] AGENTS.md referenziert
- [ ] Inline-Kommentare hilfreich
- [ ] API-Dokumentation vollständig

---

## 🚨 Häufige Probleme

### Problem 1: Fehlende GPS-Validierung
```javascript
// ❌ FEHLER: Keine Validierung
const marker = new google.maps.Marker({
  position: { lat: 51.371, lng: 7.693 }  // Nur 3 Dezimalstellen!
});

// ✅ FIX: Validierung hinzufügen
if (!validateGpsCoordinates(51.371099, 7.693150)) {
  throw new Error('Invalid GPS coordinates');
}
```

### Problem 2: Hardcodierte API-Keys
```javascript
// ❌ FEHLER: API-Key im Code
const script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC...`;

// ✅ FIX: Aus Environment laden
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) throw new Error('API key missing');
const script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
```

### Problem 3: Fehlende ARIA Labels
```html
<!-- ❌ FEHLER: Keine Accessibility -->
<button onclick="toggleRoute()">Toggle</button>

<!-- ✅ FIX: ARIA Label hinzufügen -->
<button 
  onclick="toggleRoute('A')" 
  aria-label="Toggle Route A visibility"
  aria-pressed="false">
  Toggle Route A
</button>
```

---

## 📚 Referenzen

- **[AGENTS.md](../../AGENTS.md)**: Detaillierte Entwicklungsrichtlinien
- **[Airbnb Style Guide](https://github.com/airbnb/javascript)**: JavaScript Best Practices
- **[WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)**: Accessibility Guidelines
- **[TA Lärm 1998](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)**: Offizielle Grenzwerte

---

**Review Completion:** Markiere alle Checkboxen als erledigt und dokumentiere Findings im PR-Kommentar.
