# MORPHEUS Dashboard - API & Services Integration Guide

> Schritt-für-Schritt Anleitung zur Einrichtung aller externen Dienste

---

## Übersicht: Welche APIs werden benötigt?

| Dienst | Zweck | Kosten | API-Key nötig? |
|--------|-------|--------|----------------|
| **Google Maps** | 2D Karten, Satellitenansicht | Kostenlos bis 28.000 Aufrufe/Monat | ✅ Ja |
| **Cesium Ion** | 3D Globe, Terrain, Gebäude | Kostenlos bis 5 GB/Monat | ✅ Ja |
| **Geoportal NRW** | ALKIS Flurstücke, Lärmkartierung | Kostenlos | ❌ Nein |
| **DWD Wetterdienst** | Wetterdaten für Schallausbreitung | Kostenlos | ❌ Nein |
| **Leaflet/OSM** | Basis-Kartendarstellung | Kostenlos | ❌ Nein |

---

## 1. Google Maps JavaScript API

### Schritt 1.1: Google Cloud Konto erstellen

1. Gehen Sie zu: https://console.cloud.google.com/
2. Melden Sie sich mit Ihrem Google-Konto an
3. Akzeptieren Sie die Nutzungsbedingungen

### Schritt 1.2: Neues Projekt erstellen

1. Klicken Sie oben links auf das Projekt-Dropdown
2. Klicken Sie auf "Neues Projekt"
3. Name: `MORPHEUS-Dashboard`
4. Klicken Sie "Erstellen"

### Schritt 1.3: Maps JavaScript API aktivieren

1. Gehen Sie zu: APIs & Dienste → Bibliothek
2. Suchen Sie nach "Maps JavaScript API"
3. Klicken Sie darauf und dann "Aktivieren"
4. Wiederholen Sie für:
   - "Maps Embed API"
   - "Geocoding API" (optional)

### Schritt 1.4: API-Schlüssel erstellen

1. Gehen Sie zu: APIs & Dienste → Anmeldedaten
2. Klicken Sie "Anmeldedaten erstellen" → "API-Schlüssel"
3. Kopieren Sie den Schlüssel (z.B. `AIzaSyB...xyz`)

### Schritt 1.5: API-Schlüssel einschränken (WICHTIG für Sicherheit!)

1. Klicken Sie auf den erstellten Schlüssel
2. Unter "Anwendungseinschränkungen":
   - Wählen Sie "HTTP-Verweis-URLs (Websites)"
   - Fügen Sie hinzu:
     ```
     https://darkness308.github.io/*
     http://localhost:*
     http://127.0.0.1:*
     ```
3. Unter "API-Einschränkungen":
   - Wählen Sie "Schlüssel einschränken"
   - Wählen Sie: Maps JavaScript API, Maps Embed API
4. Klicken Sie "Speichern"

### Schritt 1.6: API-Key im Code eintragen

Öffnen Sie `index.html` und ersetzen Sie:

```javascript
// Zeile ~323
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';  // ← Hier Ihren Key eintragen
```

Oder in `.env`:
```
GOOGLE_MAPS_API_KEY=AIzaSyB...IhrSchluessel
```

### Kosten-Info Google Maps

- **Kostenlos:** 28.000 Karten-Aufrufe pro Monat
- **$200 Guthaben** monatlich geschenkt
- Für Entwicklung/Demo völlig ausreichend

---

## 2. Cesium Ion (3D Globe)

### Schritt 2.1: Cesium-Konto erstellen

1. Gehen Sie zu: https://cesium.com/ion/signup
2. Registrieren Sie sich (kostenlos)
3. Bestätigen Sie Ihre E-Mail

### Schritt 2.2: Access Token erstellen

1. Nach dem Login: Gehen Sie zu "Access Tokens"
2. Klicken Sie "Create Token"
3. Name: `MORPHEUS-Dashboard`
4. Scopes: Lassen Sie die Standardwerte
5. Klicken Sie "Create"
6. Kopieren Sie den Token

### Schritt 2.3: Token im Code eintragen

Öffnen Sie `assets/cesium-3d.js` und ersetzen Sie:

```javascript
// Zeile ~40
accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.IhrToken...',
```

Oder dynamisch über das Backend laden (empfohlen):

```javascript
// Token wird automatisch vom Backend geladen
const config = await MORPHEUS_API.fetchConfig();
Cesium.Ion.defaultAccessToken = config.cesiumToken;
```

### Schritt 2.4: Assets überprüfen

In Cesium Ion unter "My Assets" sollten Sie Zugriff haben auf:
- **Cesium World Terrain** (Asset ID: 1)
- **OSM Buildings** (Asset ID: 96188)

Diese sind standardmäßig für alle Konten verfügbar.

### Kosten-Info Cesium

- **Kostenlos:** 5 GB Streaming pro Monat
- Für Demo/Entwicklung völlig ausreichend
- Kommerzielle Nutzung: Preise auf Anfrage

---

## 3. Geoportal NRW (ALKIS & Lärmkartierung)

### Keine Registrierung erforderlich!

Die WFS-Dienste des Geoportal NRW sind **öffentlich und kostenlos**.

### Verfügbare Endpunkte

| Dienst | URL | Daten |
|--------|-----|-------|
| ALKIS Vereinfacht | `https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht` | Flurstücke |
| Lärmkartierung | `https://www.wfs.nrw.de/umwelt/laermkartierung` | Lden/Lnight |
| DTK (Topographie) | `https://www.wfs.nrw.de/geobasis/wfs_nw_dtk` | Gelände |

### Test der Verbindung

Öffnen Sie im Browser:
```
https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht?service=WFS&request=GetCapabilities
```

Sie sollten eine XML-Antwort mit den verfügbaren Layern sehen.

### Im Code bereits integriert

Die Integration ist bereits in `backend/integrations/nrw_data_loader.py` implementiert:

```python
from backend.integrations.nrw_data_loader import NRWDataLoader

loader = NRWDataLoader()

# Verfügbarkeit prüfen
status = loader.check_service_availability()
print(status)

# Flurstücke laden (BBOX in UTM32N: EPSG:25832)
parcels = loader.load_alkis_data(
    bbox=(391000, 5696000, 392000, 5697000)  # Beispiel: Iserlohn
)
```

### Koordinatensystem-Hinweis

- Geoportal NRW verwendet **EPSG:25832** (UTM Zone 32N)
- Transformation von WGS84 (lat/lon) nötig
- Bereits implementiert in `geodata_service.py`:

```python
from backend.integrations.geodata_service import GeodataService

service = GeodataService()
utm_bbox = service.create_bbox_from_center(
    lat=51.3759,   # Iserlohn
    lon=7.6944,
    radius_m=500
)
# Ergebnis: (391440, 5696230, 392440, 5697230)
```

---

## 4. DWD Wetterdienst

### Keine Registrierung erforderlich!

Der Deutsche Wetterdienst bietet offene Daten an.

### Python-Bibliothek installieren

```bash
pip install wetterdienst
```

### Im Code bereits integriert

In `backend/integrations/geodata_service.py`:

```python
# Wetterdaten abrufen
weather = await service.get_weather(lat=51.3759, lon=7.6944)

print(f"Temperatur: {weather.temperature_celsius}°C")
print(f"Luftfeuchte: {weather.humidity_percent}%")
print(f"Wind: {weather.wind_speed_ms} m/s")
```

### Manuelle Abfrage (zum Testen)

```python
from wetterdienst.provider.dwd.observation import DwdObservationRequest

request = DwdObservationRequest(
    parameter=["temperature_air_mean_200"],
    resolution="hourly",
    period="recent"
)

# Station in der Nähe von Iserlohn finden
stations = request.filter_by_rank(latlon=(51.3759, 7.6944), rank=1)
values = stations.values.all()
print(values.df)
```

---

## 5. Leaflet mit OpenStreetMap

### Keine Registrierung erforderlich!

Leaflet mit OSM-Tiles ist **kostenlos und ohne API-Key** nutzbar.

### Bereits im Code

Die Integration ist in `assets/leaflet-map.js`:

```javascript
// Standard OSM Tiles (kostenlos, unbegrenzt für kleine Projekte)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Für Dark Mode: CartoDB Dark Matter
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB'
}).addTo(map);
```

### Alternative Tile-Provider

| Provider | Stil | URL |
|----------|------|-----|
| OpenStreetMap | Standard | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| CartoDB Dark | Dark Mode | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` |
| Stamen Terrain | Gelände | `https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png` |

---

## 6. Backend API Endpoints (FastAPI)

### Backend starten

```bash
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### Verfügbare Endpoints

Nach dem Start öffnen Sie: http://localhost:8000/docs

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/` | GET | API-Info |
| `/health` | GET | Health Check |
| `/api/v1/noise/calculate` | POST | ISO 9613-2 Berechnung |
| `/api/v1/noise/grid` | POST | Lärmraster berechnen |
| `/api/v1/geodata/status` | GET | Service-Status |
| `/api/v1/geodata/weather` | GET | Wetterdaten |
| `/api/v1/geodata/parcels/by-location` | GET | ALKIS Flurstücke |
| `/api/v1/geodata/noise/by-location` | GET | Lärmkartierung |
| `/ws/drone-position` | WebSocket | Live-Tracking |

---

## 7. Schnellstart: Alles zusammen

### Schritt 1: Repository klonen

```bash
git clone https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse.git
cd Live_Dashboard_Drohnen_Standort-Routenanalyse
```

### Schritt 2: .env Datei erstellen

```bash
cp .env.example .env
```

Editieren Sie `.env`:
```
GOOGLE_MAPS_API_KEY=AIzaSy...IhrGoogleKey
CESIUM_ION_TOKEN=eyJhbG...IhrCesiumToken
```

### Schritt 3: Backend installieren (optional)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Schritt 4: Frontend starten

```bash
# Im Hauptverzeichnis
python -m http.server 8000
```

Öffnen Sie: http://localhost:8000/dashboard.html

### Schritt 5: Backend starten (für Live-Daten)

```bash
# In neuem Terminal
cd backend
uvicorn api.main:app --reload --port 8001
```

---

## 8. Fehlerbehebung

### Google Maps zeigt "For development purposes only"

**Ursache:** API-Key fehlt oder ist nicht richtig konfiguriert

**Lösung:**
1. Prüfen Sie, ob der Key in `index.html` eingetragen ist
2. Prüfen Sie die Einschränkungen im Google Cloud Console
3. Aktivieren Sie die Abrechnung (auch für kostenlose Nutzung nötig)

### Cesium zeigt schwarzen Bildschirm

**Ursache:** Cesium Ion Token fehlt oder ist ungültig

**Lösung:**
1. Prüfen Sie den Token unter https://cesium.com/ion/tokens
2. Erstellen Sie ggf. einen neuen Token
3. Tragen Sie ihn in `cesium-3d.js` ein

### Geoportal NRW antwortet nicht

**Ursache:** Service temporär nicht verfügbar

**Lösung:**
1. Prüfen Sie https://www.geoportal.nrw/ auf Wartungshinweise
2. Der Code nutzt automatisch Cache-Fallback
3. Versuchen Sie es später erneut

### CORS-Fehler im Browser

**Ursache:** Backend läuft nicht oder CORS nicht konfiguriert

**Lösung:**
1. Starten Sie das Backend: `uvicorn api.main:app --reload`
2. CORS ist bereits konfiguriert für localhost und GitHub Pages

---

## 9. Checkliste vor dem Go-Live

- [ ] Google Maps API-Key erstellt und eingeschränkt
- [ ] Cesium Ion Token erstellt
- [ ] `.env` Datei konfiguriert
- [ ] Backend-Dependencies installiert (`pip install -r requirements.txt`)
- [ ] Backend läuft (`uvicorn api.main:app`)
- [ ] Frontend über HTTP-Server erreichbar
- [ ] GitHub Pages aktiviert (Settings → Pages)

---

## 10. Kosten-Übersicht

| Dienst | Monatlich kostenlos | Danach |
|--------|---------------------|--------|
| Google Maps | 28.000 Aufrufe (~$200 Wert) | $7 pro 1.000 |
| Cesium Ion | 5 GB Streaming | Auf Anfrage |
| Geoportal NRW | Unbegrenzt | - |
| DWD Wetter | Unbegrenzt | - |
| OpenStreetMap | Unbegrenzt* | - |

*Fair-Use-Policy beachten bei OSM

---

## Support & Fragen

- **GitHub Issues:** https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse/issues
- **Geoportal NRW Hilfe:** https://www.geoportal.nrw/hilfe
- **Google Maps Doku:** https://developers.google.com/maps/documentation
- **Cesium Tutorials:** https://cesium.com/learn/

---

*Letzte Aktualisierung: Dezember 2024*
