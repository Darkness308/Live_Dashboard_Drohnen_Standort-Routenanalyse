# AGENTS.md - MORPHEUS Dashboard AI Agent Guidelines

> Umfassende Richtlinien für AI-Agenten im MORPHEUS Certified Core Projekt

## 🎯 Projektübersicht

**MORPHEUS Dashboard** ist ein zweischichtiges System für gerichtsfeste Drohnen-Lärmanalyse:

- **Layer 1 (Backend)**: Python/PostGIS mit ISO 9613-2 Berechnungen
- **Layer 2 (Frontend)**: Leaflet.js Dashboard mit Echtzeit-Visualisierung

**Zielgruppe**: Regulierungsbehörden (LBA), Stakeholder, Betriebsteams

---

## 📁 Repository Struktur

```
morpheus-dashboard/
├── index.html                    # Original Dashboard (Google Maps)
├── dashboard.html                # Neues Leaflet Dashboard
├── assets/
│   ├── data.js                   # Frontend Mock-Daten
│   ├── leaflet-map.js            # Leaflet.js Karten-Modul
│   ├── fleet-dashboard.js        # Echtzeit-Flottentracker
│   ├── noise-dashboard.js        # TA-Lärm Monitoring
│   ├── charts.js                 # Chart.js Visualisierungen
│   ├── styles.css                # Tailwind + Custom Styles
│   └── geo/
│       ├── routes.geojson        # GeoJSON Routenvarianten
│       ├── locations.json        # Standorte & Immissionsorte
│       └── noise_zones.json      # Lärmzonen & TA-Lärm Limits
├── backend/
│   ├── __init__.py               # Package Init
│   ├── requirements.txt          # Python Dependencies
│   ├── integrations/
│   │   ├── __init__.py
│   │   └── nrw_data_loader.py    # Geoportal NRW WFS Client
│   ├── calculations/
│   │   ├── __init__.py
│   │   └── iso9613.py            # ISO 9613-2 Implementierung
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic Validierung
│   ├── api/                      # FastAPI REST-Endpoints
│   ├── utils/                    # Hilfsfunktionen
│   └── tests/                    # Unit Tests
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml        # Backend CI/CD
│   │   ├── self-healing.yml      # Auto-Recovery
│   │   ├── code-quality.yml      # Linting
│   │   └── accessibility.yml     # A11y Tests
│   └── prompts/                  # Copilot Prompts
├── AGENTS.md                     # Diese Datei
├── CLAUDE.md                     # Claude Code Anweisungen
└── README.md                     # Hauptdokumentation
```

---

## 🔧 Technologie-Stack

### Frontend
| Technologie | Version | Zweck |
|------------|---------|-------|
| HTML5 | - | Struktur |
| Tailwind CSS | 3.x (CDN) | Styling |
| Leaflet.js | 1.9.4 | Karten |
| Chart.js | 4.4.0 | Visualisierungen |
| JavaScript | ES2021+ | Logik |

### Backend
| Technologie | Version | Zweck |
|------------|---------|-------|
| Python | 3.11+ | Core |
| FastAPI | 0.104+ | API |
| Pydantic | 2.5+ | Validierung |
| PostGIS | 15+ | Geodatenbank |
| OWSLib | 0.29+ | WFS Client |
| Shapely | 2.0+ | Geometrie |

### Standards & Normen
| Standard | Beschreibung |
|----------|--------------|
| ISO 9613-2:1996 | Schallausbreitung im Freien |
| TA Lärm 1998 | Technische Anleitung zum Schutz gegen Lärm |
| WCAG 2.1 AA | Barrierefreiheit |
| EU 2019/947 | Drohnenverordnung |

---

## 🤖 Agent-Rollen

### 1. Frontend Development Agent

**Verantwortlichkeiten:**
- Leaflet.js Karten-Komponenten
- Dashboard UI/UX
- Chart.js Visualisierungen
- Responsive Design
- Accessibility (WCAG 2.1 AA)

**Coding Standards:**
```javascript
// Modularer Aufbau
const FleetDashboard = {
    state: {},
    init() { },
    update() { },
    render() { }
};

// JSDoc für alle Funktionen
/**
 * Initialisiert die Leaflet-Karte
 * @param {string} containerId - DOM Element ID
 * @param {Object} options - Karten-Optionen
 * @returns {L.Map} Leaflet Map Instance
 */
function initLeafletMap(containerId, options = {}) { }
```

**Konventionen:**
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.js`
- CSS Classes: BEM oder Tailwind

---

### 2. Backend Development Agent

**Verantwortlichkeiten:**
- ISO 9613-2 Berechnungen
- WFS/WMS Integration
- Pydantic Validierung
- Audit-Logging
- FastAPI Endpoints

**Coding Standards:**
```python
from typing import Optional, List
from pydantic import BaseModel, Field

class NoiseCalculationRequest(BaseModel):
    """Request für ISO 9613-2 Berechnung."""

    route_id: str = Field(..., description="Route ID")
    drone_lw: float = Field(..., ge=50, le=100, description="Schallleistung dB(A)")

    class Config:
        json_schema_extra = {
            "example": {
                "route_id": "route_a",
                "drone_lw": 75.0
            }
        }


def calculate_attenuation(distance: float, source_height: float) -> float:
    """
    Berechnet geometrische Dämpfung nach ISO 9613-2.

    Args:
        distance: Entfernung Quelle-Empfänger in Metern
        source_height: Höhe der Quelle über Grund

    Returns:
        Dämpfung in dB
    """
    pass
```

**Konventionen:**
- Type Hints: Immer verwenden
- Docstrings: Google-Style
- Packages: `snake_case`
- Classes: `PascalCase`

---

### 3. Data Integration Agent

**Verantwortlichkeiten:**
- Geoportal NRW WFS Anbindung
- ALKIS Daten-Import
- Lärmkartierung Integration
- CityGML Parser
- Audit-Trail

**WFS Endpoints:**
```python
ENDPOINTS = {
    "alkis": "https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht",
    "laerm": "https://www.wfs.nrw.de/umwelt/laermkartierung",
}

# Immer mit Retry-Logik
@retry(stop=stop_after_attempt(3), wait=wait_exponential())
def fetch_wfs_data(url: str, params: dict) -> dict:
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()
```

**Audit-Logging:**
```python
# KRITISCH: Jede Datenabfrage protokollieren
audit_record = {
    "timestamp": datetime.now().isoformat(),
    "data_source": "alkis",
    "endpoint_url": url,
    "query_parameters": params,
    "response_hash": hashlib.sha256(response.content).hexdigest(),
    "record_count": len(results),
    "success": True
}
```

---

### 4. Testing Agent

**Verantwortlichkeiten:**
- Unit Tests (pytest)
- Integration Tests
- E2E Tests (Playwright)
- Coverage Reports

**Test-Struktur:**
```python
# backend/tests/test_iso9613.py
import pytest
from backend.calculations.iso9613 import ISO9613Calculator, NoiseSource, Receiver

@pytest.fixture
def calculator():
    return ISO9613Calculator()

@pytest.fixture
def typical_drone():
    return NoiseSource.typical_drone(x=0, y=0, z=50)

class TestGeometricDivergence:
    def test_100m_distance(self, calculator):
        """Test Adiv bei 100m Entfernung (erwartet ~51 dB)."""
        result = calculator._geometric_divergence(100)
        assert 50 < result < 52

    def test_minimum_distance(self, calculator):
        """Test Mindestdistanz von 1m."""
        result = calculator._geometric_divergence(0.5)
        assert result == calculator._geometric_divergence(1)
```

---

### 5. Documentation Agent

**Verantwortlichkeiten:**
- README.md pflegen
- AGENTS.md aktualisieren
- API Dokumentation (OpenAPI)
- Inline Kommentare

**Dokumentations-Standards:**
- Markdown für alle Docs
- Code-Beispiele für alle Features
- Changelog bei Änderungen
- Diagramme bei komplexen Flows

---

### 6. DevOps Agent

**Verantwortlichkeiten:**
- GitHub Actions Workflows
- Self-Healing Automation
- Dependency Updates
- Docker Builds

**Self-Healing Patterns:**
```yaml
# .github/workflows/self-healing.yml
- name: Check WFS Availability
  run: |
    python -c "
    from backend.integrations import NRWDataLoader
    loader = NRWDataLoader()
    status = loader.check_service_availability()
    "

- name: Warm Cache on Success
  if: success()
  run: python scripts/warm_cache.py
```

---

## ⚠️ Kritische Regeln

### NIEMALS:
1. ❌ API-Keys im Frontend hardcoden
2. ❌ ISO 9613-2 Formeln ohne Review ändern
3. ❌ Audit-Logs löschen oder manipulieren
4. ❌ Pydantic-Validierung umgehen
5. ❌ Direkten DB-Zugriff ohne Repository-Pattern
6. ❌ Force-Push auf main/develop

### IMMER:
1. ✅ Type Hints verwenden (Python)
2. ✅ JSDoc für Funktionen (JavaScript)
3. ✅ Audit-Log bei Datenabfragen
4. ✅ Unit Tests für neue Features
5. ✅ Code-Review vor Merge
6. ✅ WCAG 2.1 AA einhalten

---

## 📊 TA Lärm Referenz

```
| Gebietstyp           | Tag (06-22) | Nacht (22-06) |
|---------------------|-------------|---------------|
| Industriegebiet     | 70 dB(A)    | 70 dB(A)      |
| Gewerbegebiet       | 65 dB(A)    | 50 dB(A)      |
| Kerngebiet          | 60 dB(A)    | 45 dB(A)      |
| Mischgebiet         | 60 dB(A)    | 45 dB(A)      |
| Allg. Wohngebiet    | 55 dB(A)    | 40 dB(A)      |
| Reines Wohngebiet   | 50 dB(A)    | 35 dB(A)      |
| Kurgebiet           | 45 dB(A)    | 35 dB(A)      |
| Krankenhaus         | 45 dB(A)    | 35 dB(A)      |
```

---

## 🔄 Commit Conventions

```
feat(scope): Neue Funktion
fix(scope): Bugfix
docs(scope): Dokumentation
refactor(scope): Code-Refactoring
test(scope): Tests
chore(scope): Wartung
```

**Scopes:** `frontend`, `backend`, `integrations`, `calculations`, `api`, `docs`

**Beispiel:**
```
feat(calculations): ISO 9613-2 Bodeneffekt implementiert

- Agr nach Abschnitt 7.3.1 der Norm
- Unterstützt G=0 (hart), G=1 (weich), G=0.5 (gemischt)
- Unit Tests mit 95% Coverage

Closes #42
```

---

## 🚀 Quick Commands

```bash
# Frontend starten
python -m http.server 8000
open http://localhost:8000/dashboard.html

# Backend Tests
cd backend && pytest -v --cov=.

# WFS Dienste prüfen
python -m backend.integrations.nrw_data_loader --check

# ISO 9613-2 Demo
python -m backend.calculations.iso9613

# Linting
cd backend && ruff check . && black --check .
```

---

*Letzte Aktualisierung: 2024-12-01*
*Version: 2.0.0*
