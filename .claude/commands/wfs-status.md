# WFS Status - Geoportal NRW Dienste prüfen

Prüfe den Status der NRW WFS-Dienste für das MORPHEUS Dashboard:

## Dienste zu prüfen

1. **ALKIS Vereinfacht**
   - URL: `https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht`
   - Verwendung: Grundstücksdaten, Gebäude

2. **Lärmkartierung**
   - URL: `https://www.wfs.nrw.de/umwelt/laermkartierung`
   - Verwendung: Lärmzonen, Immissionsorte

## Prüfung durchführen

Für jeden Dienst:

```python
import requests

url = "https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht"
params = {
    "service": "WFS",
    "request": "GetCapabilities"
}

try:
    response = requests.get(url, params=params, timeout=30)
    if response.status_code == 200:
        print(f"✅ {url} - Online")
    else:
        print(f"❌ {url} - Status {response.status_code}")
except Exception as e:
    print(f"❌ {url} - Error: {e}")
```

## Ausgabe

| Dienst | Status | Response Time | Version |
|--------|--------|---------------|---------|
| ALKIS | ✅/❌ | X ms | 2.0.0 |
| Lärmkartierung | ✅/❌ | X ms | 2.0.0 |

## Bei Ausfall

Wenn ein Dienst nicht erreichbar ist:
1. Prüfe ob Cache-Daten verfügbar sind
2. Dokumentiere den Ausfall im Audit-Log
3. Erstelle ein GitHub Issue mit dem Label `wfs-outage`
