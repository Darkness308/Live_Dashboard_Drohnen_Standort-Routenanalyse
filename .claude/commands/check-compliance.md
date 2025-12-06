# Check Compliance - Regulatorische Konformitätsprüfung

Prüfe die Einhaltung aller regulatorischen Standards:

## 1. GPS-Koordinaten Validierung

Durchsuche alle JavaScript-Dateien in `assets/` nach GPS-Koordinaten und prüfe:
- Müssen exakt 6 Dezimalstellen haben
- Latitude: -90 bis 90
- Longitude: -180 bis 180

Muster zum Suchen: `lat:\s*(-?\d+\.\d+)` und `lng:\s*(-?\d+\.\d+)`

## 2. TA Lärm Grenzwerte

Prüfe in `assets/data.js` ob die TA Lärm Grenzwerte korrekt sind:

| Gebietstyp | Tag (06-22) | Nacht (22-06) |
|------------|-------------|---------------|
| Wohngebiet | 55 dB(A) | 40 dB(A) |
| Gewerbe | 65 dB(A) | 50 dB(A) |
| Industrie | 70 dB(A) | 70 dB(A) |

## 3. ISO 9613-2 Implementierung

Prüfe in `backend/calculations/iso9613.py`:
- Geometrische Divergenz Adiv korrekt berechnet
- Luftabsorption Aatm vorhanden
- Bodeneffekt Agr implementiert

## 4. Sicherheitsprüfung

Scanne nach hardcodierten API-Keys:
- Google Maps API Keys: `AIzaSy[0-9A-Za-z_-]{33}`
- Generic API Keys in Anführungszeichen
- Private Keys

## 5. Accessibility (WCAG 2.1 AA)

Prüfe in `index.html`:
- `<html lang="...">` vorhanden
- Alle `<img>` haben `alt` Attribut
- Semantic HTML (`<header>`, `<main>`, `<nav>`)
- ARIA Labels auf interaktiven Elementen

## Ausgabe

Erstelle einen Compliance-Report mit:
- Anzahl der Prüfungen
- Bestandene Prüfungen
- Fehlgeschlagene Prüfungen
- Warnungen
- Empfehlungen
