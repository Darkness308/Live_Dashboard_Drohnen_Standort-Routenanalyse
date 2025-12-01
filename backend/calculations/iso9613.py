"""
ISO 9613-2 Sound Propagation Calculator
========================================

Implementiert die Berechnung der Schallausbreitung im Freien nach:
ISO 9613-2:1996 "Acoustics — Attenuation of sound during propagation outdoors"

Diese Norm beschreibt die Dämpfung durch:
- Geometrische Ausbreitung (Adiv)
- Atmosphärische Absorption (Aatm)
- Bodeneffekt (Agr)
- Abschirmung durch Hindernisse (Abar)
- Verschiedene Effekte (Amisc)

Formel: LAT = LW + Dc - A
wobei: A = Adiv + Aatm + Agr + Abar + Amisc

Referenzen:
- ISO 9613-2:1996
- VDI 2714 (Schallausbreitung im Freien)
- TA Lärm Anhang A.2
"""

import math
import logging
from dataclasses import dataclass, field
from typing import Optional, List, Tuple, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class GroundType(Enum):
    """Bodentypen nach ISO 9613-2."""
    HARD = "hard"  # G = 0: Asphalt, Beton, Wasser
    SOFT = "soft"  # G = 1: Gras, Wald, Ackerland
    MIXED = "mixed"  # G = 0.5: Gemischt


class AtmosphericCondition(Enum):
    """Atmosphärische Bedingungen."""
    FAVORABLE = "favorable"  # Mitwind/Temperaturinversion
    NEUTRAL = "neutral"
    UNFAVORABLE = "unfavorable"  # Gegenwind


@dataclass
class NoiseSource:
    """
    Repräsentiert eine Schallquelle (Drohne).

    Attributes:
        lw: Schallleistungspegel in dB(A)
        x, y, z: Position in Metern
        directivity: Richtcharakteristik Dc in dB (default 0)
        frequency_spectrum: Optional, Spektrum in Oktavbändern
    """
    lw: float  # Schallleistungspegel dB(A)
    x: float
    y: float
    z: float  # Höhe über Grund
    directivity: float = 0.0  # Richtcharakteristik Dc
    name: str = "Drohne"
    frequency_spectrum: Optional[Dict[int, float]] = None  # Hz -> dB

    # Typische Drohnen-Schallleistung
    @classmethod
    def typical_drone(cls, x: float, y: float, z: float) -> "NoiseSource":
        """Erstellt eine typische Drohnen-Schallquelle."""
        return cls(
            lw=75.0,  # Typisch für kleine Lieferdrohne
            x=x, y=y, z=z,
            name="Auriol X5",
            frequency_spectrum={
                63: 55, 125: 60, 250: 68, 500: 72,
                1000: 75, 2000: 73, 4000: 70, 8000: 65
            }
        )


@dataclass
class Receiver:
    """
    Repräsentiert einen Immissionsort (Empfänger).

    Attributes:
        x, y, z: Position in Metern
        height: Höhe des Immissionspunkts über Grund
    """
    x: float
    y: float
    z: float = 4.0  # Standard: 4m über Grund (Fenster OG)
    name: str = "Immissionsort"
    ground_type: GroundType = GroundType.MIXED


@dataclass
class WeatherConditions:
    """Meteorologische Bedingungen für die Berechnung."""
    temperature_celsius: float = 15.0
    relative_humidity_percent: float = 70.0
    atmospheric_pressure_hpa: float = 1013.25
    wind_speed_ms: float = 0.0
    wind_direction_deg: float = 0.0
    condition: AtmosphericCondition = AtmosphericCondition.NEUTRAL


@dataclass
class Obstacle:
    """Hindernis für Abschirmungsberechnung (Gebäude, Wand)."""
    x: float
    y: float
    height: float
    width: float
    length: float
    name: str = "Gebäude"


@dataclass
class AttenuationResult:
    """
    Ergebnis der Dämpfungsberechnung.

    Enthält alle Komponenten nach ISO 9613-2.
    """
    # Eingangswerte
    source_lw: float
    distance_m: float

    # Dämpfungskomponenten
    a_div: float  # Geometrische Ausbreitung
    a_atm: float  # Atmosphärische Absorption
    a_gr: float  # Bodeneffekt
    a_bar: float  # Abschirmung
    a_misc: float  # Sonstige

    # Ergebnis
    total_attenuation: float
    sound_pressure_level: float  # LAT(DW) am Empfänger

    # Metadata
    calculation_method: str = "ISO 9613-2:1996"
    notes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_lw_dba": self.source_lw,
            "distance_m": self.distance_m,
            "attenuation": {
                "geometric_div": round(self.a_div, 1),
                "atmospheric_atm": round(self.a_atm, 1),
                "ground_gr": round(self.a_gr, 1),
                "barrier_bar": round(self.a_bar, 1),
                "misc": round(self.a_misc, 1),
                "total": round(self.total_attenuation, 1)
            },
            "result_spl_dba": round(self.sound_pressure_level, 1),
            "method": self.calculation_method,
            "notes": self.notes
        }


class ISO9613Calculator:
    """
    Berechnet Schallausbreitung nach ISO 9613-2.

    Beispiel:
        calc = ISO9613Calculator()

        source = NoiseSource.typical_drone(x=0, y=0, z=50)
        receiver = Receiver(x=100, y=0, z=4)

        result = calc.calculate(source, receiver)
        print(f"Schallpegel am Empfänger: {result.sound_pressure_level:.1f} dB(A)")
    """

    # Atmosphärische Absorptionskoeffizienten α in dB/km
    # bei 20°C, 70% rel. Feuchte (Tabelle 2, ISO 9613-1)
    ATMO_ABSORPTION = {
        63: 0.1,
        125: 0.4,
        250: 1.0,
        500: 1.9,
        1000: 3.7,
        2000: 9.7,
        4000: 32.8,
        8000: 117.0
    }

    def __init__(self, weather: Optional[WeatherConditions] = None):
        """
        Initialisiert den Calculator.

        Args:
            weather: Meteorologische Bedingungen (default: Standardatmosphäre)
        """
        self.weather = weather or WeatherConditions()
        logger.info("ISO9613Calculator initialisiert")

    def calculate(
        self,
        source: NoiseSource,
        receiver: Receiver,
        obstacles: Optional[List[Obstacle]] = None,
        octave_bands: bool = False
    ) -> AttenuationResult:
        """
        Berechnet den Schallpegel am Empfänger.

        Args:
            source: Schallquelle
            receiver: Empfänger/Immissionsort
            obstacles: Liste von Hindernissen für Abschirmung
            octave_bands: Berechnung in Oktavbändern (genauer)

        Returns:
            AttenuationResult mit allen Dämpfungskomponenten
        """
        # Entfernung berechnen
        d = self._calculate_distance(source, receiver)

        # Dämpfungskomponenten berechnen
        a_div = self._geometric_divergence(d)
        a_atm = self._atmospheric_absorption(d, octave_bands, source)
        a_gr = self._ground_effect(source, receiver, d)
        a_bar = self._barrier_attenuation(source, receiver, obstacles or [])
        a_misc = 0.0  # Weitere Effekte (Vegetation, Industrie) bei Bedarf

        # Gesamtdämpfung
        total_a = a_div + a_atm + a_gr + a_bar + a_misc

        # Schallpegel am Empfänger
        # LAT = LW + Dc - A
        lat = source.lw + source.directivity - total_a

        notes = []
        if d < 1:
            notes.append("Warnung: Sehr kurze Distanz, Nahfeld-Effekte möglich")
        if source.z > 100:
            notes.append("Hinweis: Große Quellhöhe, vereinfachte Bodeneffekt-Berechnung")

        result = AttenuationResult(
            source_lw=source.lw,
            distance_m=d,
            a_div=a_div,
            a_atm=a_atm,
            a_gr=a_gr,
            a_bar=a_bar,
            a_misc=a_misc,
            total_attenuation=total_a,
            sound_pressure_level=lat,
            notes=notes
        )

        logger.debug(f"Berechnung: {source.name} -> {receiver.name}: {lat:.1f} dB(A)")

        return result

    def _calculate_distance(self, source: NoiseSource, receiver: Receiver) -> float:
        """Berechnet die 3D-Distanz zwischen Quelle und Empfänger."""
        dx = receiver.x - source.x
        dy = receiver.y - source.y
        dz = receiver.z - source.z
        return math.sqrt(dx**2 + dy**2 + dz**2)

    def _geometric_divergence(self, distance: float) -> float:
        """
        Berechnet die geometrische Ausbreitung Adiv.

        Formel: Adiv = 20 * log10(d) + 11 dB

        Für Punktquelle im Freifeld.
        """
        if distance < 1:
            distance = 1  # Minimum 1m

        return 20 * math.log10(distance) + 11

    def _atmospheric_absorption(
        self,
        distance: float,
        octave_bands: bool,
        source: NoiseSource
    ) -> float:
        """
        Berechnet die atmosphärische Absorption Aatm.

        Formel: Aatm = α * d / 1000 (α in dB/km)

        Bei Oktavband-Berechnung wird das Spektrum berücksichtigt.
        """
        if octave_bands and source.frequency_spectrum:
            # Gewichtete Mittelung über Oktavbänder
            total_absorption = 0
            for freq, level in source.frequency_spectrum.items():
                alpha = self.ATMO_ABSORPTION.get(freq, 3.7)  # Default 1kHz
                total_absorption += alpha * (distance / 1000) * (10 ** (level / 10))

            # Zurückrechnen (vereinfacht)
            return total_absorption / len(source.frequency_spectrum)
        else:
            # Vereinfacht: A-bewerteter Wert bei 500Hz
            alpha_a = 2.0  # dB/km, typisch A-bewertet
            return alpha_a * (distance / 1000)

    def _ground_effect(
        self,
        source: NoiseSource,
        receiver: Receiver,
        distance: float
    ) -> float:
        """
        Berechnet den Bodeneffekt Agr nach ISO 9613-2.

        Vereinfachte Methode (Abschnitt 7.3.1):
        - Berücksichtigt Quell- und Empfängerhöhe
        - Bodentyp (hart/weich/gemischt)
        """
        hs = source.z  # Quellhöhe
        hr = receiver.z  # Empfängerhöhe
        dp = math.sqrt(distance**2 - (hs - hr)**2)  # Projektion auf Boden

        if dp < 1:
            return 0

        # Mittlere Höhe über dem Ausbreitungsweg
        hm = (hs + hr) / 2

        # Bodenfaktor G (0=hart, 1=weich)
        g = 0.5 if receiver.ground_type == GroundType.MIXED else \
            0.0 if receiver.ground_type == GroundType.HARD else 1.0

        # Vereinfachte Formel für mittlere Frequenzen
        # Agr = 4.8 - (2*hm/d) * [17 + (300/d)]
        if dp > 0:
            a_gr = 4.8 - (2 * hm / dp) * (17 + 300 / dp)
            a_gr = max(0, min(a_gr, 10)) * g  # Begrenzen und mit G skalieren
        else:
            a_gr = 0

        return a_gr

    def _barrier_attenuation(
        self,
        source: NoiseSource,
        receiver: Receiver,
        obstacles: List[Obstacle]
    ) -> float:
        """
        Berechnet die Abschirmung durch Hindernisse Abar.

        Verwendet die Maekawa-Formel für einfache Hindernisse.
        """
        if not obstacles:
            return 0

        max_attenuation = 0

        for obstacle in obstacles:
            # Prüfen ob Hindernis zwischen Quelle und Empfänger liegt
            # (vereinfachte Prüfung)

            # Pfaddifferenz δ berechnen (vereinfacht)
            # δ = (dss + dsr) - dsr_direct

            # Direkte Distanz
            d_direct = self._calculate_distance(source, receiver)

            # Distanz über Hindernis (vereinfacht: über Oberkante)
            d_to_obstacle = math.sqrt(
                (obstacle.x - source.x)**2 +
                (obstacle.y - source.y)**2 +
                (obstacle.height - source.z)**2
            )
            d_from_obstacle = math.sqrt(
                (receiver.x - obstacle.x)**2 +
                (receiver.y - obstacle.y)**2 +
                (receiver.z - obstacle.height)**2
            )

            delta = d_to_obstacle + d_from_obstacle - d_direct

            if delta > 0:
                # Maekawa-Formel
                # Dz = 10 * log10(3 + 20*N) für N > 0
                # N = 2 * δ / λ (Fresnel-Zahl)

                wavelength = 0.34  # ca. 1kHz bei 340 m/s
                n = 2 * delta / wavelength

                if n > 0:
                    dz = 10 * math.log10(3 + 20 * n)
                    dz = min(dz, 25)  # Max 25 dB nach ISO 9613-2
                    max_attenuation = max(max_attenuation, dz)

        return max_attenuation

    def calculate_grid(
        self,
        source: NoiseSource,
        bbox: Tuple[float, float, float, float],
        grid_size: float = 10.0,
        receiver_height: float = 4.0
    ) -> List[Dict]:
        """
        Berechnet ein Lärmraster für einen Bereich.

        Args:
            source: Schallquelle
            bbox: (minx, miny, maxx, maxy)
            grid_size: Rastergröße in Metern
            receiver_height: Höhe der Empfänger

        Returns:
            Liste von Rasterpunkten mit Koordinaten und Schallpegel
        """
        minx, miny, maxx, maxy = bbox
        results = []

        x = minx
        while x <= maxx:
            y = miny
            while y <= maxy:
                receiver = Receiver(x=x, y=y, z=receiver_height)
                result = self.calculate(source, receiver)

                results.append({
                    "x": x,
                    "y": y,
                    "z": receiver_height,
                    "spl_dba": round(result.sound_pressure_level, 1),
                    "distance_m": round(result.distance_m, 1)
                })

                y += grid_size
            x += grid_size

        logger.info(f"Rasterberechnung: {len(results)} Punkte")
        return results


# ============================================================================
# TA Lärm Grenzwert-Prüfung
# ============================================================================

class TALaermChecker:
    """Prüft Einhaltung der TA Lärm Grenzwerte."""

    # Immissionsrichtwerte nach TA Lärm Nr. 6.1
    LIMITS = {
        "industriegebiet": {"tag": 70, "nacht": 70},
        "gewerbegebiet": {"tag": 65, "nacht": 50},
        "kerngebiet": {"tag": 60, "nacht": 45},
        "mischgebiet": {"tag": 60, "nacht": 45},
        "allgemeines_wohngebiet": {"tag": 55, "nacht": 40},
        "reines_wohngebiet": {"tag": 50, "nacht": 35},
        "kurgebiet": {"tag": 45, "nacht": 35},
        "krankenhaus": {"tag": 45, "nacht": 35}
    }

    @classmethod
    def check_compliance(
        cls,
        spl: float,
        zone_type: str,
        is_night: bool = False
    ) -> Dict[str, Any]:
        """
        Prüft ob ein Schallpegel den TA Lärm Grenzwert einhält.

        Args:
            spl: Beurteilungspegel in dB(A)
            zone_type: Gebietstyp nach TA Lärm
            is_night: Nachtzeit (22:00-06:00)?

        Returns:
            Dictionary mit Compliance-Status
        """
        limits = cls.LIMITS.get(zone_type.lower(), cls.LIMITS["mischgebiet"])
        limit = limits["nacht"] if is_night else limits["tag"]

        margin = limit - spl
        compliant = margin >= 0

        return {
            "compliant": compliant,
            "measured_spl": round(spl, 1),
            "limit": limit,
            "margin_db": round(margin, 1),
            "zone_type": zone_type,
            "time_period": "nacht" if is_night else "tag",
            "status": "KONFORM" if compliant else "ÜBERSCHREITUNG"
        }


# ============================================================================
# CLI Interface
# ============================================================================

def main():
    """Demo der ISO 9613-2 Berechnung."""
    print("\n=== ISO 9613-2 Schallausbreitung Demo ===\n")

    # Typische Drohne
    source = NoiseSource.typical_drone(x=0, y=0, z=50)
    print(f"Quelle: {source.name}")
    print(f"  Position: ({source.x}, {source.y}, {source.z}m)")
    print(f"  Schallleistung: {source.lw} dB(A)")

    # Empfänger in verschiedenen Entfernungen
    calc = ISO9613Calculator()

    print("\n--- Schallpegel am Empfänger ---\n")
    print(f"{'Entfernung':>12} | {'SPL':>8} | {'Dämpfung':>10} | {'TA Lärm WA':>12}")
    print("-" * 50)

    for distance in [50, 100, 200, 500, 1000]:
        receiver = Receiver(x=distance, y=0, z=4)
        result = calc.calculate(source, receiver)

        compliance = TALaermChecker.check_compliance(
            result.sound_pressure_level,
            "allgemeines_wohngebiet"
        )

        status = "✓" if compliance["compliant"] else "✗"

        print(
            f"{distance:>10}m | "
            f"{result.sound_pressure_level:>6.1f} dB | "
            f"{result.total_attenuation:>8.1f} dB | "
            f"{status} {compliance['margin_db']:+.1f} dB"
        )

    print("\n--- Rasterberechnung ---\n")
    grid = calc.calculate_grid(
        source,
        bbox=(-100, -100, 100, 100),
        grid_size=50
    )
    print(f"Berechnete Rasterpunkte: {len(grid)}")


if __name__ == "__main__":
    main()
