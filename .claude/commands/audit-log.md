# Audit Log - Gerichtsfeste Dokumentation

Erstelle oder prüfe die Audit-Logs für gerichtsfeste Dokumentation:

## Audit-Log Struktur

Jeder Eintrag muss enthalten:

```python
audit_record = {
    "timestamp": "ISO 8601 Format",
    "action": "Durchgeführte Aktion",
    "data_source": "ALKIS | LAERM | CALCULATION",
    "endpoint_url": "URL des Dienstes",
    "query_parameters": {},
    "response_hash": "SHA-256 Hash der Antwort",
    "record_count": 0,
    "calculation_method": "ISO 9613-2:1996",
    "algorithm_version": "1.0.0",
    "user": "System oder Benutzer",
    "success": true
}
```

## Log-Dateien prüfen

1. Suche nach bestehenden Audit-Logs in:
   - `backend/logs/audit/`
   - `backend/data/audit.json`

2. Prüfe die letzten 10 Einträge auf Vollständigkeit

3. Validiere:
   - Zeitstempel korrekt formatiert
   - Hashes sind valide SHA-256
   - Alle Pflichtfelder vorhanden

## Neue Einträge erstellen

Bei jeder Datenabfrage:

```python
import hashlib
from datetime import datetime

def create_audit_entry(action, data_source, response_content):
    return {
        "timestamp": datetime.now().isoformat(),
        "action": action,
        "data_source": data_source,
        "response_hash": hashlib.sha256(response_content).hexdigest(),
        "success": True
    }
```

## Wichtig für Gerichtsfestigkeit

- Logs dürfen NIEMALS gelöscht werden
- Jede Änderung muss protokolliert werden
- Hashes ermöglichen Integritätsprüfung
- Timestamps müssen in UTC sein
