# MORPHEUS Dashboard - Drohnen-Standort & Routenanalyse

> **Gerichtsfestes Analyse-Dashboard für BVLOS-Drohnenrouten mit ISO 9613-2 Lärmberechnung, TA Lärm Compliance und amtlichen Geodaten**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green.svg)](https://leafletjs.com/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

## 🏷️ Topics

`drone-logistics` · `iso-9613-2` · `ta-laerm` · `noise-analysis` · `geoportal-nrw` · `alkis` · `leaflet` · `fastapi` · `postgis` · `certified-calculations` · `bvlos` · `route-optimization`

---

## 📐 Architektur: Dual-Layer System

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Frontend Dashboard (HTML/JS + Leaflet/CesiumJS)       │
│  ├─ Interaktive Karte mit Routen & Lärmzonen                    │
│  ├─ Echtzeit-Flottentracker                                     │
│  └─ TA-Lärm Monitoring Dashboard                                │
├─────────────────────────────────────────────────────────────────┤
│  API Gateway (FastAPI)                                          │
│  ├─ JWT Authentication                                          │
│  ├─ Rate Limiting & Caching                                     │
│  └─ Audit Logging (gerichtsfest)                                │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: Certified Backend (Python + PostGIS)                  │
│  ├─ ISO 9613-2 Schallausbreitungsberechnung                     │
│  ├─ ALKIS/Lärmkartierung WFS Import (Geoportal NRW)             │
│  ├─ CityGML LoD2 Parser (Gebäudeabschirmung)                    │
│  └─ DWD Wetterdaten Integration                                 │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ├─ PostGIS (amtliche + berechnete Daten)                       │
│  ├─ Redis (Caching)                                             │
│  └─ Audit Trail (JSONL)                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🚁 Features

### Frontend Dashboard
- **Leaflet.js Karte**: 3 Routenvarianten mit Toggle, Terrain/Satellit Layer
- **Custom Marker**: Labor (grün), Krankenhäuser (blau), Sensoren (gelb/rot)
- **Lärmzonen-Overlay**: Farbcodierte TA-Lärm Zonen mit Popup-Details
- **Live Flottentracker**: 5x Auriol Drohnen mit Batterie, Position, ETA
- **Flugplan-Tabelle**: Nächste 5 Flüge mit Wetterwarnungen
- **TA-Lärm Matrix**: 10 Immissionsorte mit Echtzeit-Compliance

### Backend (Certified Core)
- **ISO 9613-2 Berechnung**: Vollständige Implementierung mit Dämpfungskomponenten
- **Geoportal NRW Integration**: ALKIS Flurstücke, Lärmkartierung WFS
- **Audit-Logging**: Gerichtsfeste Protokollierung aller Berechnungen
- **Pydantic Validierung**: Strenge Eingabevalidierung für alle Daten

## 📋 Voraussetzungen

### Frontend
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- HTTP-Server für lokale Entwicklung

### Backend
- Python 3.11+
- PostgreSQL 15+ mit PostGIS
- Redis (optional, für Caching)

## 🚀 Installation

### Frontend (Schnellstart)

```bash
# Repository klonen
git clone https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse.git
cd Live_Dashboard_Drohnen_Standort-Routenanalyse

# Server starten
python -m http.server 8000

# Browser öffnen
open http://localhost:8000/dashboard.html
```

### Backend Installation

```bash
# Virtual Environment erstellen
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oder: venv\Scripts\activate  # Windows

# Dependencies installieren
pip install -r requirements.txt

# NRW WFS-Dienste testen
python -m backend.integrations.nrw_data_loader --check

# ISO 9613-2 Demo
python -m backend.calculations.iso9613
```

## 📁 Projektstruktur

```
Live_Dashboard_Drohnen_Standort-Routenanalyse/
├── index.html                    # Original Dashboard (Google Maps)
├── dashboard.html                # Neues Leaflet Dashboard
├── assets/
│   ├── data.js                   # Mock-Daten
│   ├── leaflet-map.js            # Leaflet.js Karten-Modul
│   ├── fleet-dashboard.js        # Flottentracker
│   ├── noise-dashboard.js        # TA-Lärm Monitoring
│   ├── charts.js                 # Chart.js Visualisierungen
│   ├── styles.css                # Benutzerdefinierte Stile
│   └── geo/
│       ├── routes.geojson        # Routenvarianten
│       ├── locations.json        # Standorte & Immissionsorte
│       └── noise_zones.json      # Lärmzonen & TA-Lärm Limits
├── backend/
│   ├── __init__.py
│   ├── requirements.txt          # Python Dependencies
│   ├── integrations/
│   │   ├── __init__.py
│   │   └── nrw_data_loader.py    # Geoportal NRW WFS Client
│   ├── calculations/
│   │   ├── __init__.py
│   │   └── iso9613.py            # ISO 9613-2 Implementierung
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic Schemas
│   ├── api/                      # FastAPI Endpoints
│   ├── utils/                    # Hilfsfunktionen
│   └── tests/                    # Unit Tests
├── .github/
│   ├── workflows/                # CI/CD Pipelines
│   ├── prompts/                  # Copilot Prompts
│   └── PULL_REQUEST_TEMPLATE.md
├── AGENTS.md                     # AI Agent Guidelines
├── CLAUDE.md                     # Claude Code Instructions
├── README.md                     # Diese Datei
└── LICENSE
```

## 🔊 ISO 9613-2 Schallausbreitung

Die Backend-Implementierung berechnet die Schallausbreitung nach ISO 9613-2:1996:

```python
from backend.calculations.iso9613 import ISO9613Calculator, NoiseSource, Receiver

# Drohne als Schallquelle
source = NoiseSource.typical_drone(x=0, y=0, z=50)

# Immissionsort
receiver = Receiver(x=100, y=0, z=4, name="Wohngebiet")

# Berechnung
calc = ISO9613Calculator()
result = calc.calculate(source, receiver)

print(f"Schallpegel: {result.sound_pressure_level:.1f} dB(A)")
print(f"Dämpfung gesamt: {result.total_attenuation:.1f} dB")
```

### Dämpfungskomponenten

| Komponente | Formel | Beschreibung |
|------------|--------|--------------|
| Adiv | 20·log₁₀(d) + 11 | Geometrische Ausbreitung |
| Aatm | α·d/1000 | Atmosphärische Absorption |
| Agr | f(hs, hr, d, G) | Bodeneffekt |
| Abar | Maekawa | Abschirmung durch Hindernisse |

## 🗺️ Geoportal NRW Integration

Der NRW Data Loader bindet amtliche Geodaten an:

```python
from backend.integrations.nrw_data_loader import NRWDataLoader

loader = NRWDataLoader()

# Dienste prüfen
status = loader.check_service_availability()

# ALKIS Flurstücke laden
flurstuecke = loader.load_alkis_data(
    bbox=(360000, 5660000, 370000, 5670000),
    srs="EPSG:25832"
)

# Lärmkartierung laden
laerm = loader.load_noise_data(
    bbox=(360000, 5660000, 370000, 5670000),
    noise_type="strasse"
)
```

### Unterstützte Dienste

| Dienst | URL | Daten |
|--------|-----|-------|
| ALKIS | wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht | Flurstücke, Eigentumsart |
| Lärmkartierung | wfs.nrw.de/umwelt/laermkartierung | Lden, Lnight |
| CityGML | open.nrw (Download) | LoD2 Gebäudemodelle |

## 📊 TA-Lärm Grenzwerte

| Gebietstyp | Tag (06-22) | Nacht (22-06) |
|------------|-------------|---------------|
| Industriegebiet | 70 dB(A) | 70 dB(A) |
| Gewerbegebiet | 65 dB(A) | 50 dB(A) |
| Mischgebiet | 60 dB(A) | 45 dB(A) |
| Allg. Wohngebiet | 55 dB(A) | 40 dB(A) |
| Reines Wohngebiet | 50 dB(A) | 35 dB(A) |
| Kurgebiet/Krankenhaus | 45 dB(A) | 35 dB(A) |

## 🔒 Gerichtsfestigkeit

Das Backend implementiert Audit-Logging für rechtssichere Dokumentation:

```json
{
  "timestamp": "2024-12-01T19:00:00Z",
  "data_source": "alkis",
  "endpoint_url": "https://wfs.nrw.de/...",
  "query_parameters": {"bbox": [...], "srs": "EPSG:25832"},
  "response_hash": "sha256:abc123...",
  "record_count": 150,
  "processing_time_ms": 1234,
  "success": true
}
```

## 🧪 Tests

```bash
# Backend Tests
cd backend
pytest tests/ -v --cov=.

# Frontend Tests (falls vorhanden)
npm test
```

## 📝 Dokumentation

- **[AGENTS.md](AGENTS.md)**: Richtlinien für AI-Agenten
- **[CLAUDE.md](CLAUDE.md)**: Claude Code Anweisungen
- **[.github/README.md](.github/README.md)**: GitHub-spezifische Dokumentation

## 🔄 Self-Healing & Automation

Das Projekt unterstützt automatische Fehlerbehebung:

1. **Pre-Commit Hooks**: Linting & Formatierung
2. **CI/CD Pipeline**: Tests bei jedem Push
3. **Dependency Updates**: Dependabot aktiviert
4. **Error Recovery**: Retry-Logik für WFS-Anfragen

## 🌐 API Endpoints

### Routen & Flotte
```
GET  /api/v1/routes               # Alle Drohnen-Routen
GET  /api/v1/routes/{id}          # Einzelne Route
GET  /api/v1/drones               # Flottenübersicht
GET  /api/v1/immissionsorte       # Lärmmesspunkte
GET  /api/v1/config               # Frontend-Konfiguration
```

### Lärmberechnung
```
POST /api/v1/calculate/noise      # ISO 9613-2 Berechnung
POST /api/v1/calculate/grid       # Rasterberechnung für Lärmkarten
POST /api/v1/compliance/check     # TA Lärm Compliance-Prüfung
GET  /api/v1/compliance/limits    # TA Lärm Grenzwerte
```

### Geodaten
```
POST /api/v1/geodata/alkis        # ALKIS Flurstücke
POST /api/v1/geodata/noise        # Lärmkartierung NRW
GET  /api/v1/geodata/services/status  # WFS Service Status
```

### System
```
GET  /api/v1/audit/trail          # Audit-Log (gerichtsfest)
GET  /health                      # Health-Check
WS   /ws/drone-position           # WebSocket Live-Tracking
```

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 👥 Mitwirkende

- MORPHEUS Project Team
- Darkness308

## 📧 Kontakt

Bei Fragen oder Problemen erstellen Sie bitte ein [Issue](https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse/issues).

## 🔮 Roadmap

### Abgeschlossen
- [x] Leaflet.js Integration
- [x] Flotten-Dashboard mit Live-Updates
- [x] TA-Lärm Monitoring Dashboard
- [x] ISO 9613-2 Backend-Implementierung
- [x] Geoportal NRW WFS Integration
- [x] FastAPI REST-Endpoints
- [x] CesiumJS 3D-Visualisierung
- [x] DWD Wetter-Integration
- [x] Google Maps 3D Integration
- [x] WebSocket Live-Tracking
- [x] NumPy/Numba Performance-Optimierung

### In Planung
- [ ] CityGML LoD2 Parser (Gebäudeabschirmung)
- [ ] PDF/CSV Export
- [ ] Mobile App

---

**Zertifizierter Kern** | **Amtliche Daten** | **Gerichtsfeste Berechnung**
