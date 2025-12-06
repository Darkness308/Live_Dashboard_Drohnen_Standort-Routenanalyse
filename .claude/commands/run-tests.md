# Run Tests - Vollständige Testsuite ausführen

Führe die vollständige Testsuite für das MORPHEUS Dashboard aus:

## 1. Backend Tests (Python/pytest)

```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-cov pytest-asyncio
pytest tests/ -v --cov=. --cov-report=term-missing
```

Zeige:
- Anzahl bestandener/fehlgeschlagener Tests
- Code Coverage Prozentsatz
- Nicht abgedeckte Zeilen

## 2. ISO 9613-2 Berechnungstests

Führe spezifische Tests für die Lärmberechnungen aus:

```bash
pytest tests/test_iso9613.py -v
```

Kritische Tests:
- Geometrische Divergenz bei 100m (~51 dB)
- Mindestdistanz 1m Handling
- Luftabsorption bei verschiedenen Frequenzen

## 3. WFS Integration Tests

Prüfe die Verfügbarkeit der NRW WFS-Dienste:

```python
from backend.integrations.nrw_data_loader import NRWDataLoader
loader = NRWDataLoader()
status = loader.check_service_availability()
```

## 4. Frontend Validierung

- HTML Validierung mit html-validate
- ESLint Check
- GPS-Koordinaten Validierung

## Zusammenfassung

Erstelle eine Testzusammenfassung:
- Backend Coverage: X%
- Frontend Checks: X/X bestanden
- WFS Services: Online/Offline
- Gesamtstatus: PASSED/FAILED
