# Documentation Prompt - MORPHEUS Dashboard

> Guidelines for creating and maintaining high-quality documentation

## 📚 Documentation Framework

Dieser Prompt hilft dir, vollständige und benutzerfreundliche Dokumentation für das MORPHEUS Dashboard zu erstellen und zu pflegen.

---

## 📋 Dokumentations-Typen

### 1. Code-Dokumentation (JSDoc)
### 2. README.md (Benutzerdokumentation)
### 3. API-Dokumentation
### 4. Setup-Anleitungen
### 5. Troubleshooting-Guides
### 6. Regulatory Compliance Referenzen

---

## 💻 1. Code-Dokumentation (JSDoc)

### 1.1 JSDoc Standard

**Pflicht für alle Funktionen:**

```javascript
/**
 * Renders a drone route polyline on the Google Map with validated GPS coordinates
 * 
 * This function creates a colored polyline representing a flight route on the map.
 * All GPS coordinates are validated to ensure exactly 6 decimal places before rendering.
 * 
 * @param {google.maps.Map} map - The initialized Google Maps instance
 * @param {Object} route - Route data object containing waypoints and metadata
 * @param {string} route.name - Human-readable route name (e.g., "Route A - Optimized")
 * @param {string} route.color - Hex color code for the route line (e.g., "#3B82F6")
 * @param {Array<{lat: number, lng: number}>} route.waypoints - Array of GPS waypoints
 * @param {number} route.distance - Total route distance in kilometers
 * @param {string} routeId - Unique route identifier (e.g., "route1", "route2")
 * @returns {google.maps.Polyline} The created polyline instance for further manipulation
 * @throws {Error} If map is not initialized or GPS coordinates are invalid
 * 
 * @example
 * // Render Route A (blue, optimized route)
 * const polyline = renderRoute(map, {
 *   name: "Route A - Optimized",
 *   color: "#3B82F6",
 *   distance: 8.5,
 *   waypoints: [
 *     { lat: 51.371099, lng: 7.693150 },
 *     { lat: 51.375421, lng: 7.698234 }
 *   ]
 * }, "route1");
 * 
 * // Later: Hide the route
 * polyline.setVisible(false);
 * 
 * @see {@link https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline|Google Maps Polyline}
 * @see validateGpsCoordinates
 * @since 1.0.0
 */
function renderRoute(map, route, routeId) {
  // Validate map instance
  if (!map || !google.maps) {
    throw new Error('Google Maps not initialized. Call loadGoogleMapsApi() first.');
  }
  
  // Validate GPS coordinates (exactly 6 decimal places required)
  route.waypoints.forEach((waypoint, index) => {
    if (!validateGpsCoordinates(waypoint.lat, waypoint.lng)) {
      throw new Error(
        `Invalid GPS coordinates at waypoint ${index} in ${routeId}: ` +
        `lat=${waypoint.lat}, lng=${waypoint.lng}. ` +
        `Coordinates must have exactly 6 decimal places.`
      );
    }
  });
  
  // Create and return polyline
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

### 1.2 JSDoc Tags Reference

| Tag | Verwendung | Beispiel |
|-----|-----------|----------|
| `@param` | Funktionsparameter | `@param {string} name - User's name` |
| `@returns` | Rückgabewert | `@returns {boolean} Validation result` |
| `@throws` | Exceptions | `@throws {Error} If input is invalid` |
| `@example` | Verwendungsbeispiel | `@example const result = func()` |
| `@see` | Referenzen | `@see {@link OtherFunction}` |
| `@since` | Version | `@since 1.0.0` |
| `@deprecated` | Veraltet | `@deprecated Use newFunction instead` |
| `@todo` | Offene Aufgaben | `@todo Add error handling` |

### 1.3 Inline-Kommentare

**Wann verwenden:**
- Komplexe Algorithmen erklären
- Nicht-offensichtliche Workarounds dokumentieren
- Business-Logik klären
- Regulatory Requirements referenzieren

```javascript
/**
 * Checks if noise level complies with TA Lärm regulations
 */
function checkTaLaermCompliance(noiseLevel, areaType, timeOfDay) {
  // TA Lärm 1998: Official German noise protection standards
  // Source: https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm
  const thresholds = {
    // Residential areas (Wohngebiete) - TA Lärm Nr. 6.1 a
    residential: { 
      day: 55,    // 06:00-22:00
      night: 40   // 22:00-06:00
    },
    // Commercial areas (Gewerbegebiete) - TA Lärm Nr. 6.1 e
    commercial: {
      day: 65,
      night: 50
    },
    // Industrial areas (Industriegebiete) - TA Lärm Nr. 6.1 f
    industrial: {
      day: 70,
      night: 70   // Same threshold day and night
    }
  };
  
  const limit = thresholds[areaType]?.[timeOfDay];
  
  if (!limit) {
    throw new Error(
      `Invalid parameters: areaType="${areaType}", timeOfDay="${timeOfDay}". ` +
      `Valid area types: residential, commercial, industrial. ` +
      `Valid time of day: day, night.`
    );
  }
  
  return noiseLevel <= limit;
}
```

---

## 📖 2. README.md Updates

### 2.1 Struktur

```markdown
# Projekt-Titel

> Kurze, prägnante Beschreibung (1-2 Sätze)

[![License Badge](url)]()
[![Build Status](url)]()
[![WCAG 2.1 AA](url)]()

## 🚀 Features

- Feature 1: Beschreibung
- Feature 2: Beschreibung
- Feature 3: Beschreibung

## 📋 Voraussetzungen

- Anforderung 1
- Anforderung 2
- Anforderung 3

## 🛠️ Installation

### Schritt 1: Repository klonen
```bash
git clone URL
cd project
```

### Schritt 2: Abhängigkeiten installieren
```bash
npm install
```

### Schritt 3: Konfiguration
```bash
cp .env.example .env
# Edit .env file
```

## 📚 Verwendung

### Basis-Verwendung
```javascript
// Code-Beispiel
```

### Erweiterte Verwendung
```javascript
// Erweitertes Beispiel
```

## 🎨 Komponenten

### Komponente 1
Beschreibung und Verwendung

### Komponente 2
Beschreibung und Verwendung

## 🐛 Troubleshooting

### Problem 1
**Symptom:** Beschreibung
**Lösung:** Schritte zur Behebung

### Problem 2
**Symptom:** Beschreibung
**Lösung:** Schritte zur Behebung

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](CONTRIBUTING.md)

## 📝 Lizenz

Dieses Projekt ist unter der [MIT Lizenz](LICENSE) lizenziert.

## 📧 Kontakt

- GitHub Issues: [Link]
- Email: [Email]
```

### 2.2 README.md Best Practices

**DO:**
- ✅ Klare, präzise Sprache verwenden
- ✅ Screenshots/GIFs für UI-Features
- ✅ Code-Beispiele mit Syntax-Highlighting
- ✅ Schritt-für-Schritt Anleitungen
- ✅ Badges für Status-Indikatoren
- ✅ Inhaltsverzeichnis bei langen Dokumenten
- ✅ Links zu relevanten Ressourcen

**DON'T:**
- ❌ Veraltete Informationen
- ❌ Zu viel technisches Detail (→ separate Docs)
- ❌ Ungetestete Beispiele
- ❌ Fehlende Voraussetzungen
- ❌ Keine Versionsinformationen

---

## 🔌 3. API-Dokumentation

### 3.1 Funktions-API

```markdown
## `validateGpsCoordinates(lat, lng)`

Validates GPS coordinates for required 6-decimal precision.

### Parameters

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `lat` | `number` | Latitude coordinate (-90 to 90) | Yes |
| `lng` | `number` | Longitude coordinate (-180 to 180) | Yes |

### Returns

| Type | Description |
|------|-------------|
| `boolean` | `true` if coordinates have exactly 6 decimals, `false` otherwise |

### Throws

| Exception | Condition |
|-----------|-----------|
| N/A | No exceptions thrown (returns false on invalid input) |

### Example

```javascript
// Valid coordinates (6 decimals)
validateGpsCoordinates(51.371099, 7.693150); // returns true

// Invalid coordinates (3 decimals)
validateGpsCoordinates(51.371, 7.693); // returns false

// Out of range
validateGpsCoordinates(91, 7.693150); // returns false
```

### Notes

- GPS coordinates MUST have exactly 6 decimal places per MORPHEUS standards
- Valid latitude range: -90 to 90
- Valid longitude range: -180 to 180
- Used for data validation before rendering on Google Maps

### See Also

- [renderRoute()](#renderroute)
- [GPS Standards Documentation](../docs/gps-standards.md)
```

### 3.2 Datenstruktur-Dokumentation

```markdown
## Route Data Structure

Defines the structure for flight route data in the MORPHEUS system.

### Schema

```typescript
interface Route {
  id: string;                    // Unique identifier (e.g., "route1")
  name: string;                  // Human-readable name
  color: string;                 // Hex color code (e.g., "#3B82F6")
  distance: number;              // Distance in kilometers
  duration: number;              // Flight duration in minutes
  noiseExposure: number;         // Average noise exposure in dB(A)
  energyConsumption: number;     // Battery usage percentage
  taCompliance: boolean;         // TA Lärm compliance status
  waypoints: Array<{            // GPS waypoints (6 decimal precision)
    lat: number;                 // Latitude (-90 to 90)
    lng: number;                 // Longitude (-180 to 180)
  }>;
  metadata?: {                   // Optional metadata
    createdAt?: string;          // ISO 8601 date
    sailLevel?: number;          // SAIL level (1-6)
    weatherSuitability?: string[]; // Weather conditions
  };
}
```

### Example

```javascript
const exampleRoute = {
  id: "route1",
  name: "Route A - Optimized",
  color: "#3B82F6",
  distance: 8.5,
  duration: 18,
  noiseExposure: 52,
  energyConsumption: 72,
  taCompliance: true,
  waypoints: [
    { lat: 51.371099, lng: 7.693150 },
    { lat: 51.375421, lng: 7.698234 },
    { lat: 51.379876, lng: 7.703567 }
  ],
  metadata: {
    createdAt: "2025-12-01T10:00:00Z",
    sailLevel: 3,
    weatherSuitability: ["clear", "light-wind"]
  }
};
```

### Validation Rules

1. **GPS Coordinates**: Must have exactly 6 decimal places
2. **Color**: Must be valid hex color code
3. **TA Compliance**: Must be validated against official TA Lärm thresholds
4. **SAIL Level**: Must be 1-6 (if provided)

### See Also

- [TA Lärm Compliance](#ta-laerm-compliance)
- [GPS Validation](#gps-validation)
```

---

## 🛠️ 4. Setup-Anleitungen

### 4.1 Entwicklungsumgebung Setup

```markdown
# Entwicklungsumgebung Setup

## Voraussetzungen

- Node.js 18+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- Modern Browser (Chrome 100+, Firefox 100+, Safari 15+)
- Google Cloud Account (für Maps API Key)

## Schritt 1: Repository klonen

```bash
git clone https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse.git
cd Live_Dashboard_Drohnen_Standort-Routenanalyse
```

## Schritt 2: Google Maps API Key erstellen

1. Besuche [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere folgende APIs:
   - Maps JavaScript API
   - Maps SDK for Android (optional)
   - Visualization Library

4. Erstelle API Key:
   - Navigation: APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Kopiere den generierten Key

5. (Optional) API Key einschränken:
   - Application restrictions: HTTP referrers
   - API restrictions: Maps JavaScript API

## Schritt 3: Environment konfigurieren

```bash
# Erstelle .env Datei
cp .env.example .env

# Bearbeite .env und füge deinen API Key ein
# GOOGLE_MAPS_API_KEY=dein_echter_api_key_hier
```

⚠️ **Wichtig:** Committe niemals die `.env` Datei!

## Schritt 4: Lokalen Server starten

### Option A: Python
```bash
python -m http.server 8000
```

### Option B: Node.js
```bash
npx http-server -p 8000
```

### Option C: VS Code Live Server
1. Installiere "Live Server" Extension
2. Rechtsklick auf `index.html` → "Open with Live Server"

## Schritt 5: Dashboard öffnen

Öffne Browser und navigiere zu:
```
http://localhost:8000
```

## Troubleshooting

### Problem: "Google Maps not loading"
**Lösung:** 
- Prüfe API Key in `.env`
- Stelle sicher, dass Maps JavaScript API aktiviert ist
- Prüfe Browser Console für Fehler

### Problem: "CORS Error"
**Lösung:**
- Verwende einen HTTP-Server (nicht `file://`)
- Python/Node.js Server starten (siehe Schritt 4)

## Nächste Schritte

- Lies [AGENTS.md](AGENTS.md) für Entwicklungsrichtlinien
- Siehe [README.md](README.md) für Feature-Übersicht
- Prüfe [.github/prompts/](. github/prompts/) für Entwicklungs-Prompts
```

---

## 🔧 5. Troubleshooting-Guides

### 5.1 Häufige Probleme

```markdown
# Troubleshooting Guide

## Karte wird nicht angezeigt

### Symptom
Leerer Bereich wo die Karte sein sollte, keine Fehler in Console

### Mögliche Ursachen & Lösungen

#### 1. API-Key fehlt oder ungültig
**Diagnose:**
```javascript
console.log(process.env.GOOGLE_MAPS_API_KEY);
```

**Lösung:**
- Erstelle `.env` Datei: `cp .env.example .env`
- Füge gültigen API-Key ein
- Starte Server neu

#### 2. Maps JavaScript API nicht aktiviert
**Diagnose:**
Browser Console zeigt: "Google Maps API error: InvalidKeyMapError"

**Lösung:**
1. Besuche [Google Cloud Console](https://console.cloud.google.com/)
2. Navigation: APIs & Services → Library
3. Suche "Maps JavaScript API"
4. Click "Enable"

#### 3. Container hat keine Höhe
**Diagnose:**
```javascript
console.log(document.getElementById('map').offsetHeight); // 0?
```

**Lösung:**
```css
#map {
  width: 100%;
  height: 600px;  /* Explizite Höhe setzen */
  min-height: 400px;
}
```

## GPS-Koordinaten ungenau

### Symptom
Marker erscheinen an falschen Positionen

### Diagnose
```javascript
// Prüfe Dezimalstellen
const waypoint = { lat: 51.371, lng: 7.693 };
console.log(waypoint.lat.toString().split('.')[1].length); // Sollte 6 sein
```

### Lösung
Korrigiere auf exakt 6 Dezimalstellen:
```javascript
// ❌ FALSCH
{ lat: 51.371, lng: 7.693 }

// ✅ RICHTIG
{ lat: 51.371099, lng: 7.693150 }
```

## Charts werden nicht angezeigt

### Symptom
Leere Bereiche wo Charts sein sollten

### Mögliche Ursachen & Lösungen

#### 1. Chart.js nicht geladen
**Diagnose:**
```javascript
console.log(typeof Chart); // "undefined"?
```

**Lösung:**
Prüfe ob CDN-Script im `<head>` vorhanden:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
```

#### 2. Canvas-Element fehlt
**Diagnose:**
```javascript
console.log(document.getElementById('taLaermChart')); // null?
```

**Lösung:**
Stelle sicher, dass Canvas-Element existiert:
```html
<canvas id="taLaermChart"></canvas>
```

#### 3. Falsche Datenstruktur
**Diagnose:**
Browser Console zeigt Chart.js Error

**Lösung:**
Validiere Datenstruktur:
```javascript
const chartData = {
  labels: ['A', 'B', 'C'],  // Labels und Daten müssen gleiche Länge haben
  datasets: [{
    data: [10, 20, 30]      // 3 Elemente wie Labels
  }]
};
```

## Accessibility-Probleme

### Symptom
Screen Reader liest Elemente nicht vor

### Lösung

#### Fehlende ARIA Labels
```html
<!-- ❌ FALSCH -->
<button onclick="toggle()">Toggle</button>

<!-- ✅ RICHTIG -->
<button onclick="toggle()" aria-label="Toggle heatmap visibility">
  Toggle Heatmap
</button>
```

#### Nicht-semantisches HTML
```html
<!-- ❌ FALSCH -->
<div onclick="submit()">Submit</div>

<!-- ✅ RICHTIG -->
<button onclick="submit()">Submit</button>
```

## Performance-Probleme

### Symptom
Dashboard lädt langsam oder ruckelt

### Lösungen

#### 1. Zu viele Marker
```javascript
// Verwende Marker Clustering für >100 Marker
const markerCluster = new MarkerClusterer(map, markers, {
  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
});
```

#### 2. Chart-Updates zu häufig
```javascript
// Debounce Chart-Updates
const updateChart = debounce(() => {
  chart.update();
}, 300);
```

## CORS-Fehler

### Symptom
Browser Console: "Cross-Origin Request Blocked"

### Lösung
```bash
# Verwende HTTP-Server, NICHT file://
python -m http.server 8000

# Öffne dann http://localhost:8000
```

## Browser-Kompatibilität

### Symptom
Funktioniert in Chrome, aber nicht in Safari

### Lösung
Verwende Browser-kompatible Features:
```javascript
// ❌ PROBLEMATISCH: Optional Chaining (Safari <13.1)
const value = obj?.nested?.value;

// ✅ KOMPATIBEL
const value = obj && obj.nested && obj.nested.value;
```

## Support

Wenn das Problem weiterhin besteht:
1. Erstelle GitHub Issue mit:
   - Genaue Fehlerbeschreibung
   - Reproduktionsschritte
   - Browser & Version
   - Console Errors/Logs
2. Kontaktiere: [GitHub Issues](https://github.com/Darkness308/Live_Dashboard.../issues)
```

---

## 📜 6. Regulatory Compliance Referenzen

### 6.1 TA Lärm Dokumentation

```markdown
# TA Lärm Compliance Documentation

## Überblick

TA Lärm (Technische Anleitung zum Schutz gegen Lärm) ist die deutsche Lärmschutzverordnung, die Grenzwerte für Lärmemissionen festlegt.

## Offizielle Quelle

**Vollständiger Text:**  
[TA Lärm 1998](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)

**Rechtsgrundlage:**  
Bundes-Immissionsschutzgesetz (BImSchG) § 48

## Grenzwerte

### Wohngebiete (TA Lärm Nr. 6.1 a)

| Zeitraum | Grenzwert | Beschreibung |
|----------|-----------|--------------|
| Tag | 55 dB(A) | 06:00 - 22:00 Uhr |
| Nacht | 40 dB(A) | 22:00 - 06:00 Uhr |

**Code-Implementierung:**
```javascript
const TA_LAERM_WOHNGEBIET = {
  TAG: 55,    // dB(A), 06:00-22:00
  NACHT: 40   // dB(A), 22:00-06:00
};
```

### Gewerbegebiete (TA Lärm Nr. 6.1 e)

| Zeitraum | Grenzwert | Beschreibung |
|----------|-----------|--------------|
| Tag | 65 dB(A) | 06:00 - 22:00 Uhr |
| Nacht | 50 dB(A) | 22:00 - 06:00 Uhr |

### Industriegebiete (TA Lärm Nr. 6.1 f)

| Zeitraum | Grenzwert | Beschreibung |
|----------|-----------|--------------|
| Tag & Nacht | 70 dB(A) | Gleicher Wert |

## Compliance-Berechnung

```javascript
/**
 * Checks TA Lärm compliance
 * @param {number} noiseLevel - Measured noise in dB(A)
 * @param {string} areaType - 'residential', 'commercial', 'industrial'
 * @param {string} timeOfDay - 'day' (06:00-22:00) or 'night' (22:00-06:00)
 * @returns {boolean} Compliance status
 * @see {@link https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm|TA Lärm 1998}
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

## Messverfahren

TA Lärm schreibt vor:
- Messung in dB(A) (A-bewerteter Schalldruckpegel)
- Messposition: 0,5 m vor dem geöffneten Fenster
- Messhöhe: Mitte des Fensters, mindestens 1,2 m über Gelände
- Mittelungspegel über Beurteilungszeitraum

## Referenzen

- [TA Lärm Volltext](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)
- [BImSchG](https://www.gesetze-im-internet.de/bimschg/)
- [Umweltbundesamt - Lärmschutz](https://www.umweltbundesamt.de/themen/verkehr-laerm)
```

---

## ✅ Dokumentations-Checkliste

### Code-Dokumentation
- [ ] JSDoc für alle öffentlichen Funktionen
- [ ] Parameter-Typen dokumentiert
- [ ] Rückgabewerte dokumentiert
- [ ] Exceptions dokumentiert
- [ ] Beispiele bereitgestellt
- [ ] Komplexe Algorithmen kommentiert

### README.md
- [ ] Projekt-Beschreibung klar und präzise
- [ ] Installation Steps vollständig
- [ ] Verwendungsbeispiele funktional
- [ ] Screenshots/GIFs aktuell
- [ ] Troubleshooting Section vorhanden
- [ ] Kontakt-Informationen aktuell

### API-Dokumentation
- [ ] Alle öffentlichen APIs dokumentiert
- [ ] Parameter-Tabellen vollständig
- [ ] Return-Values beschrieben
- [ ] Beispiele getestet
- [ ] Datenstrukturen definiert

### Setup-Anleitungen
- [ ] Voraussetzungen aufgelistet
- [ ] Schritt-für-Schritt Anleitung
- [ ] Troubleshooting integriert
- [ ] Cross-Platform (Windows/Mac/Linux)

### Regulatory Docs
- [ ] Offizielle Quellen referenziert
- [ ] Grenzwerte korrekt
- [ ] Code-Beispiele vorhanden
- [ ] Letzte Aktualisierung vermerkt

---

## 📚 Referenzen

- **[AGENTS.md](../../AGENTS.md)**: Entwicklungsrichtlinien
- **[copilot-instructions.md](../copilot-instructions.md)**: Coding Standards
- **[JSDoc Reference](https://jsdoc.app/)**: JSDoc Dokumentation
- **[Markdown Guide](https://www.markdownguide.org/)**: Markdown Syntax

---

**Dokumentation Complete!** 📝

Vollständige und gut gepflegte Dokumentation ist der Schlüssel zu erfolgreicher Zusammenarbeit und langfristigem Projekterfolg.
