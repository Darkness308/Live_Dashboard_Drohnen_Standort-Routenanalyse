# MORPHEUS Dashboard - Drohnen-Standort & Routenanalyse

> **Interaktives Analyse-Dashboard für BVLOS-Drohnenroute mit TA Lärm Compliance, 3D-Visualisierung und Echtzeit-Routenvergleich**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Maps API](https://img.shields.io/badge/Google%20Maps-API-red.svg)](https://developers.google.com/maps)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

## 🏷️ Topics

`drone-logistics` · `google-maps-api` · `noise-analysis` · `ta-laerm` · `sail-iii` · `3d-visualization` · `bvlos` · `route-optimization` · `compliance-monitoring` · `tailwindcss` · `chartjs` · `responsive-design` · `accessibility`

---

Live Dashboard für automatisierte Drohnen mit Google Maps Integration, TA Lärm Compliance Visualisierung, 3-Routen-Vergleich, Immissionsorte Heatmap und Flottenstand Widget. Alle Daten aus validierten MORPHEUS Quellen (GPS, SAIL III, Regulatory Compliance).

## 🚁 Features

### Core Functionality
- **Google Maps JavaScript API Integration**: Interaktive Karte mit 3D-Visualisierung
- **TA Lärm Compliance Monitoring**: Echtzeit-Überwachung der Lärmschutzverordnung
- **3-Routen-Vergleich**: Detaillierter Vergleich von drei optimierten Flugrouten
- **Immissionsorte Heatmap**: Visualisierung von Lärmmessungen als Heatmap
- **Flottenstand Widget**: Live-Status aller Drohnen in der Flotte
- **Regulatory Compliance Dashboard**: EU 2019/945, EU 2019/947, SAIL III Status

### Technical Features
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Barrierefreiheit**: WCAG 2.1 AA konform
- **Mehrsprachig**: Deutsch (DE) und Englisch (EN)
- **Modulare Architektur**: Klare Trennung von Daten, Logik und Präsentation
- **Modern Tech Stack**: Tailwind CSS, Chart.js, Google Maps API

## 📋 Voraussetzungen

- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Google Maps JavaScript API Key
- HTTP-Server für lokale Entwicklung (z.B. Python's `http.server`, Node.js `http-server`, oder Live Server in VS Code)

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse.git
cd Live_Dashboard_Drohnen_Standort-Routenanalyse
```

### 2. Google Maps API Key konfigurieren

1. Erstellen Sie einen Google Maps API Key:
   - Besuchen Sie [Google Cloud Console](https://console.cloud.google.com/)
   - Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes
   - Aktivieren Sie die folgenden APIs:
     - Maps JavaScript API
     - Maps SDK for Android (optional)
     - Places API (optional)
   - Erstellen Sie einen API Key unter "Credentials"

2. Konfigurieren Sie den API Key:
   ```bash
   cp .env.example .env
   ```
   
3. Öffnen Sie die Datei `index.html` und ersetzen Sie `YOUR_API_KEY` mit Ihrem echten API Key:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'IHR_GOOGLE_MAPS_API_KEY';
   ```

   **Hinweis für Produktion**: In einer echten Produktionsumgebung sollten Sie den API Key serverseitig laden und nicht direkt im HTML einbetten.

### 3. Lokalen Server starten

#### Option A: Python (empfohlen)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Option B: Node.js http-server
```bash
npm install -g http-server
http-server -p 8000
```

#### Option C: VS Code Live Server
- Installieren Sie die "Live Server" Extension in VS Code
- Rechtsklick auf `index.html` → "Open with Live Server"

### 4. Dashboard öffnen

Öffnen Sie Ihren Browser und navigieren Sie zu:
```
http://localhost:8000
```

## 📁 Projektstruktur

```
Live_Dashboard_Drohnen_Standort-Routenanalyse/
├── index.html              # Haupt-HTML-Datei mit Dashboard-Layout
├── assets/
│   ├── data.js            # Validierte MORPHEUS Datenquellen (GPS, SAIL III)
│   ├── maps.js            # Google Maps API Integration & Interaktivität
│   ├── charts.js          # Chart.js Visualisierungen
│   └── styles.css         # Benutzerdefinierte CSS-Stile
├── .env.example           # Beispiel-Umgebungskonfiguration
├── .gitignore            # Git Ignore-Datei
├── LICENSE               # Lizenz
└── README.md             # Diese Datei
```

## 🎨 Komponenten

### 1. Flottenstand Widget
Zeigt den aktuellen Status der Drohnenflotte:
- Gesamtzahl der Drohnen
- Aktive Drohnen im Flug
- Drohnen im Ladevorgang
- Drohnen in Wartung

### 2. Interaktive Karte
- **Immissionsorte**: Markierungen zeigen Lärmmessstationen
- **3 Routen**: Farbcodierte Flugrouten (Blau, Grün, Orange)
- **Heatmap**: Visualisierung der Lärmbelastung
- **Toggle-Controls**: Ein-/Ausblenden von Routen und Heatmap

### 3. TA Lärm Compliance Chart
- 24-Stunden-Überwachung der Lärmwerte
- Visualisierung von Tag- und Nachtgrenzwerten
- Compliance-Status für jede Messung

### 4. 3-Routen-Vergleich
Detaillierte Tabelle mit:
- Distanz (km)
- Flugdauer (Minuten)
- Lärmbelastung (dB)
- Energieverbrauch (%)
- TA Lärm Compliance-Status

### 5. Multi-Metrik Radar Chart
Vergleicht Routen anhand von:
- Distanzeffizienz
- Zeiteffizienz
- Lärmbelastung
- Energieeffizienz
- Compliance-Status

### 6. Historische Lärmbelastung
Liniendiagramm zeigt 7-Tage-Trend für alle drei Routen

### 7. Regulatory Compliance Status
Übersicht über:
- EU Drohnenverordnung (EU 2019/945 & EU 2019/947)
- TA Lärm 1998 Standard
- SAIL III Framework Status

## 🌐 Internationalisierung

Das Dashboard unterstützt zwei Sprachen:
- **Deutsch (DE)**: Standard
- **Englisch (EN)**: Über Sprachwahl in der Kopfzeile

Sprachwechsel aktualisiert:
- Alle UI-Texte
- Chart-Beschriftungen
- Tooltips und Hilfetexte

## ♿ Barrierefreiheit (WCAG 2.1 AA)

Das Dashboard erfüllt WCAG 2.1 AA Standards:

### Implementierte Features:
- **Semantisches HTML**: Korrekte Verwendung von `<header>`, `<main>`, `<nav>`, `<section>`
- **ARIA Labels**: Alle interaktiven Elemente haben beschreibende Labels
- **Keyboard Navigation**: Vollständige Bedienung ohne Maus möglich
- **Focus Indicators**: Sichtbare Focus-States für Tastaturnavigation
- **Skip Links**: "Skip to main content" Link am Seitenanfang
- **Screen Reader Support**: Alt-Texte und ARIA-Beschreibungen
- **Kontrastverhältnis**: Mindestens 4.5:1 für Text
- **Responsive Text**: Skalierbar bis 200% ohne Funktionsverlust
- **Reduzierte Bewegung**: Respektiert `prefers-reduced-motion`

## 📊 Datenquellen

Alle Daten stammen aus validierten MORPHEUS Quellen:

### GPS-Daten
- Echtzeit-Positionsdaten der Drohnen
- Waypoint-Koordinaten für Routenplanung
- Immissionsorte-Koordinaten

### SAIL III (Specific Assurance and Integrity Level)
- Routenvalidierung nach SAIL III Framework
- Sicherheitsassessment
- Integritätsprüfung

### Regulatory Compliance
- EU Drohnenverordnung 2019/945 & 2019/947
- TA Lärm 1998 (Technische Anleitung zum Schutz gegen Lärm)
- Kontinuierliche Compliance-Überwachung

## 🔧 Anpassung

### Eigene Daten verwenden

Bearbeiten Sie `assets/data.js` um eigene Daten zu integrieren:

```javascript
// Beispiel: Neue Immissionsorte hinzufügen
const immissionsorte = [
  { 
    id: 11, 
    lat: 52.5300, 
    lng: 13.4100, 
    name: "Neuer Messpunkt", 
    noiseLevel: 50, 
    type: "residential" 
  }
  // ... weitere Punkte
];
```

### Styling anpassen

Ändern Sie CSS-Variablen in `assets/styles.css`:

```css
:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
  /* ... weitere Farben */
}
```

### Weitere Routen hinzufügen

Erweitern Sie das `routeData` Objekt in `assets/data.js`:

```javascript
const routeData = {
  route4: {
    name: "Neue Route D",
    color: "#8B5CF6",
    distance: 9.5,
    // ... weitere Eigenschaften
  }
};
```

## 🐛 Troubleshooting

### Karte wird nicht angezeigt
- Überprüfen Sie, ob der Google Maps API Key korrekt konfiguriert ist
- Stellen Sie sicher, dass die Maps JavaScript API aktiviert ist
- Prüfen Sie die Browser-Konsole auf Fehlermeldungen

### Charts werden nicht geladen
- Öffnen Sie die Seite über einen HTTP-Server (nicht direkt als Datei)
- Prüfen Sie, ob Chart.js korrekt geladen wird (siehe Browser-Konsole)

### CORS-Fehler
- Verwenden Sie einen lokalen HTTP-Server statt direktem Dateizugriff
- Bei Remote-Servern: Konfigurieren Sie CORS-Header korrekt

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) Datei für Details.

## 👥 Mitwirkende

- MORPHEUS Project Team
- Darkness308

## 📧 Kontakt

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im GitHub Repository.

## 🔄 Versionshistorie

### Version 1.0.0 (2023-12)
- Initial Release
- Google Maps Integration
- TA Lärm Compliance Visualisierung
- 3-Routen-Vergleich
- Immissionsorte Heatmap
- Flottenstand Widget
- Mehrsprachigkeit (DE/EN)
- WCAG 2.1 AA Compliance

## 🔮 Geplante Features

- [ ] Echtzeit-Datenanbindung über WebSocket
- [ ] Historische Datenanalyse mit erweiterten Zeiträumen
- [ ] Export-Funktionen (PDF, CSV)
- [ ] Benutzerdefinierte Alarme und Benachrichtigungen
- [ ] Mobile App (iOS/Android)
- [ ] 3D-Terrain-Visualisierung
- [ ] KI-gestützte Routenoptimierung

## 🙏 Danksagungen

- Google Maps Platform für die exzellente API
- Chart.js Team für die leistungsstarke Visualisierungsbibliothek
- Tailwind CSS für das moderne CSS-Framework
- Open-Source Community
