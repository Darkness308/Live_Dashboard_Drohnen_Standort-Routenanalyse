# CLAUDE.md - Claude Code Instructions

> Anweisungen für Claude Code AI-Assistenten im MORPHEUS Dashboard Projekt

## Projektübersicht

**MORPHEUS Dashboard** ist ein zweischichtiges System für gerichtsfeste Drohnen-Lärmanalyse:

1. **Frontend (Layer 2)**: Leaflet.js Dashboard mit Echtzeit-Visualisierung
2. **Backend (Layer 1)**: Python/PostGIS mit ISO 9613-2 Berechnungen

## Arbeitskontext

### Primäre Technologien

| Bereich | Technologie |
|---------|-------------|
| Frontend | HTML5, Tailwind CSS, Leaflet.js, Chart.js |
| Backend | Python 3.11+, FastAPI, Pydantic |
| Geodaten | PostGIS, Shapely, OWSLib |
| Standards | ISO 9613-2, TA Lärm 1998 |

### Wichtige Dateipfade

```
/backend/integrations/nrw_data_loader.py  # Geoportal NRW WFS Client
/backend/calculations/iso9613.py          # ISO 9613-2 Implementierung
/backend/models/schemas.py                # Pydantic Datenmodelle
/assets/leaflet-map.js                    # Leaflet Karten-Modul
/assets/fleet-dashboard.js                # Flottentracker
/assets/noise-dashboard.js                # TA-Lärm Monitoring
```

## Entwicklungsrichtlinien

### 1. Code-Stil

#### Python (Backend)
```python
# Verwende Type Hints
def calculate_noise(source: NoiseSource, receiver: Receiver) -> AttenuationResult:
    """
    Berechnet den Schallpegel am Empfänger nach ISO 9613-2.

    Args:
        source: Schallquelle (Drohne)
        receiver: Immissionsort

    Returns:
        AttenuationResult mit allen Dämpfungskomponenten
    """
    pass

# Pydantic für Validierung
class NoiseCalculationRequest(BaseModel):
    route: FlightRoute
    drone: DroneModel
    immissionsorte: List[ImmissionsortInput]
```

#### JavaScript (Frontend)
```javascript
// Modularer Aufbau
const FleetDashboard = {
    init() { ... },
    update() { ... },
    render() { ... }
};

// JSDoc Kommentare
/**
 * Initialisiert die Leaflet-Karte
 * @param {string} containerId - DOM Element ID
 * @returns {L.Map} Leaflet Map Instance
 */
function initLeafletMap(containerId) { ... }
```

### 2. Gerichtsfestigkeit (KRITISCH)

Bei Berechnungen IMMER:

1. **Audit-Log schreiben**:
   ```python
   self._log_audit(
       data_source=DataSource.ALKIS,
       endpoint_url=endpoint.url,
       query_parameters=params,
       response_hash=hashlib.sha256(response.content).hexdigest(),
       record_count=len(results),
       success=True
   )
   ```

2. **Datenquellen dokumentieren**:
   - Zeitstempel der Abfrage
   - WFS-Service Version
   - Verwendete Parameter

3. **Algorithmus-Version tracken**:
   ```python
   calculation_method: str = "ISO 9613-2:1996"
   algorithm_version: str = "1.0.0"
   ```

### 3. Fehlerbehandlung

```python
# Mit Retry-Logik für WFS-Anfragen
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
def fetch_wfs_data(url: str, params: dict) -> dict:
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()
```

### 4. Testing

```python
# pytest mit Fixtures
@pytest.fixture
def sample_drone():
    return NoiseSource.typical_drone(x=0, y=0, z=50)

def test_geometric_divergence(sample_drone):
    calc = ISO9613Calculator()
    result = calc._geometric_divergence(100)
    assert 45 < result < 55  # ~51 dB bei 100m
```

## Häufige Aufgaben

### WFS-Daten laden

```python
from backend.integrations.nrw_data_loader import NRWDataLoader

loader = NRWDataLoader()

# Immer zuerst Verfügbarkeit prüfen
status = loader.check_service_availability()
if not status['alkis']['available']:
    raise ServiceUnavailableError("ALKIS WFS nicht erreichbar")

# Dann Daten laden
data = loader.load_alkis_data(bbox=(...))
```

### Lärmberechnung durchführen

```python
from backend.calculations.iso9613 import ISO9613Calculator, NoiseSource, Receiver

calc = ISO9613Calculator()
source = NoiseSource(lw=75.0, x=0, y=0, z=50)
receiver = Receiver(x=100, y=0, z=4)

result = calc.calculate(source, receiver)

# TA-Lärm Compliance prüfen
from backend.calculations.iso9613 import TALaermChecker
compliance = TALaermChecker.check_compliance(
    result.sound_pressure_level,
    "allgemeines_wohngebiet"
)
```

### Frontend-Komponente erstellen

```javascript
// Neue Dashboard-Sektion
function createNoiseWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} nicht gefunden`);
        return;
    }

    // Render
    container.innerHTML = `
        <div class="dashboard-section">
            <h3>${translations[currentLang].title}</h3>
            <!-- Content -->
        </div>
    `;

    // Event Listener
    setupEventListeners();
}
```

## Verbotene Aktionen

1. **KEINE hardcodierten API-Keys** im Frontend
2. **KEINE Änderungen** an ISO 9613-2 Formeln ohne Review
3. **KEINE Löschung** von Audit-Logs
4. **KEINE Umgehung** der Pydantic-Validierung
5. **KEIN direkter DB-Zugriff** ohne ORM/Repository Pattern

## Commit-Konventionen

```
feat: Neue Funktion hinzugefügt
fix: Bugfix
docs: Dokumentation aktualisiert
refactor: Code-Refactoring ohne Funktionsänderung
test: Tests hinzugefügt/geändert
chore: Wartungsarbeiten (Dependencies, Config)
```

Beispiel:
```
feat(backend): ISO 9613-2 Bodeneffekt-Berechnung implementiert

- Agr nach Abschnitt 7.3.1 implementiert
- Unterstützt harten, weichen und gemischten Boden
- Unit Tests hinzugefügt
```

## Self-Healing Patterns

### Automatische Wiederherstellung

```python
# Bei WFS-Fehlern: Fallback auf Cache
def load_data_with_fallback(bbox):
    try:
        return loader.load_from_wfs(bbox)
    except WFSServiceError:
        logger.warning("WFS nicht erreichbar, verwende Cache")
        return loader.load_from_cache(bbox)
```

### Dependency Injection

```python
# Für einfaches Testing und Austausch
class NoiseCalculationService:
    def __init__(
        self,
        calculator: ISO9613Calculator = None,
        data_loader: NRWDataLoader = None
    ):
        self.calculator = calculator or ISO9613Calculator()
        self.data_loader = data_loader or NRWDataLoader()
```

## Kontakt & Eskalation

Bei Unklarheiten zu:
- **ISO 9613-2 Formeln**: Verweis auf Norm-Dokument
- **TA Lärm Grenzwerte**: Verweis auf Nr. 6.1 TA Lärm
- **WFS-Services**: Geoportal NRW Dokumentation

---

*Letzte Aktualisierung: 2024-12-01*
