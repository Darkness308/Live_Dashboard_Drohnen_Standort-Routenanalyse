# ISO 9613-2 Berechnung - Lärmausbreitung berechnen

Führe eine ISO 9613-2 konforme Lärmausbreitungsberechnung durch:

## Eingabeparameter

Frage nach folgenden Werten:

1. **Schallquelle (Drohne)**
   - Schallleistungspegel Lw in dB(A) (typisch: 70-80 dB)
   - Position (x, y, z in Metern)

2. **Empfänger (Immissionsort)**
   - Position (x, y, z in Metern)
   - Gebietstyp für TA Lärm Grenzwert

3. **Umgebungsbedingungen**
   - Temperatur (°C, Standard: 15)
   - Relative Luftfeuchte (%, Standard: 70)
   - Bodentyp: hart (G=0) | weich (G=1) | gemischt (G=0.5)

## Berechnung

Verwende die ISO 9613-2 Formel:

```
Lp = Lw - Adiv - Aatm - Agr - Abar - Amisc
```

Wobei:
- **Adiv**: Geometrische Divergenz = 20 * log10(d) + 11
- **Aatm**: Luftabsorption = α * d / 1000 (α abhängig von T, RH, f)
- **Agr**: Bodeneffekt (nach Abschnitt 7.3.1)
- **Abar**: Abschirmung (falls Hindernisse)
- **Amisc**: Sonstige Dämpfung

## Python Code

```python
from backend.calculations.iso9613 import ISO9613Calculator, NoiseSource, Receiver

calc = ISO9613Calculator()
source = NoiseSource(lw=75.0, x=0, y=0, z=50)
receiver = Receiver(x=100, y=0, z=4)

result = calc.calculate(source, receiver)

print(f"Schalldruckpegel am Empfänger: {result.sound_pressure_level:.1f} dB(A)")
print(f"Geometrische Divergenz: {result.adiv:.1f} dB")
print(f"Luftabsorption: {result.aatm:.1f} dB")
print(f"Bodeneffekt: {result.agr:.1f} dB")
```

## TA Lärm Compliance

Prüfe das Ergebnis gegen die TA Lärm Grenzwerte:

| Gebietstyp | Tag (06-22) | Nacht (22-06) |
|------------|-------------|---------------|
| Wohngebiet | 55 dB(A) | 40 dB(A) |
| Gewerbe | 65 dB(A) | 50 dB(A) |
| Industrie | 70 dB(A) | 70 dB(A) |

## Audit-Log

Erstelle einen Audit-Eintrag mit:
- Berechnungsmethode: "ISO 9613-2:1996"
- Eingabeparameter
- Berechnungsergebnis
- TA Lärm Compliance Status
