"""
Unit Tests für ISO 9613-2 Schallausbreitungsberechnung
======================================================

Tests für alle Dämpfungskomponenten nach ISO 9613-2:1996:
- Geometrische Ausbreitung (Adiv)
- Atmosphärische Absorption (Aatm)
- Bodeneffekt (Agr)
- Abschirmung durch Hindernisse (Abar)

Referenzen:
- ISO 9613-2:1996 Tabellen und Beispielrechnungen
- TA Lärm 1998 Anhang A.2
"""

import pytest
import math
from backend.calculations.iso9613 import (
    ISO9613Calculator,
    NoiseSource,
    Receiver,
    WeatherConditions,
    Obstacle,
    AttenuationResult,
    GroundType,
    TALaermChecker
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def calculator():
    """Standard ISO9613 Calculator ohne Wetterdaten."""
    return ISO9613Calculator()


@pytest.fixture
def calculator_with_weather():
    """Calculator mit definierten Wetterbedingungen."""
    weather = WeatherConditions(
        temperature_celsius=20.0,
        relative_humidity_percent=70.0,
        atmospheric_pressure_hpa=1013.25
    )
    return ISO9613Calculator(weather=weather)


@pytest.fixture
def typical_drone():
    """Typische Drohnen-Schallquelle (Auriol X5)."""
    return NoiseSource.typical_drone(x=0, y=0, z=50)


@pytest.fixture
def custom_source():
    """Benutzerdefinierte Schallquelle."""
    return NoiseSource(
        lw=80.0,
        x=100,
        y=50,
        z=30,
        name="Test-Drohne"
    )


@pytest.fixture
def ground_receiver():
    """Empfänger auf Bodenniveau."""
    return Receiver(x=100, y=0, z=1.5, name="Boden")


@pytest.fixture
def elevated_receiver():
    """Empfänger in erhöhter Position (Fenster OG)."""
    return Receiver(x=100, y=0, z=4.0, name="Fenster OG")


@pytest.fixture
def residential_receiver():
    """Empfänger in Wohngebiet."""
    return Receiver(
        x=200, y=0, z=4.0,
        name="Wohngebiet",
        ground_type=GroundType.SOFT
    )


# =============================================================================
# Tests: NoiseSource
# =============================================================================

class TestNoiseSource:
    """Tests für die NoiseSource Klasse."""

    def test_typical_drone_creation(self):
        """Test: Typische Drohne wird korrekt erstellt."""
        drone = NoiseSource.typical_drone(x=0, y=0, z=50)

        assert drone.lw == 75.0
        assert drone.x == 0
        assert drone.y == 0
        assert drone.z == 50
        assert drone.name == "Auriol X5"
        assert drone.directivity == 0.0

    def test_typical_drone_frequency_spectrum(self):
        """Test: Frequenzspektrum ist definiert."""
        drone = NoiseSource.typical_drone(x=0, y=0, z=50)

        assert drone.frequency_spectrum is not None
        assert 1000 in drone.frequency_spectrum
        assert drone.frequency_spectrum[1000] == 75  # Maximalpegel bei 1kHz

    def test_custom_source_attributes(self, custom_source):
        """Test: Benutzerdefinierte Quelle hat korrekte Attribute."""
        assert custom_source.lw == 80.0
        assert custom_source.x == 100
        assert custom_source.y == 50
        assert custom_source.z == 30


# =============================================================================
# Tests: Receiver
# =============================================================================

class TestReceiver:
    """Tests für die Receiver Klasse."""

    def test_default_receiver_height(self):
        """Test: Standard-Empfängerhöhe ist 4m."""
        receiver = Receiver(x=100, y=0)
        assert receiver.z == 4.0

    def test_default_ground_type(self):
        """Test: Standard-Bodentyp ist MIXED."""
        receiver = Receiver(x=100, y=0)
        assert receiver.ground_type == GroundType.MIXED

    def test_custom_ground_type(self):
        """Test: Benutzerdefinierter Bodentyp."""
        receiver = Receiver(x=100, y=0, ground_type=GroundType.HARD)
        assert receiver.ground_type == GroundType.HARD


# =============================================================================
# Tests: Geometrische Ausbreitung (Adiv)
# =============================================================================

class TestGeometricDivergence:
    """Tests für die geometrische Ausbreitung nach ISO 9613-2 Abschnitt 7.1."""

    def test_divergence_at_1m(self, calculator):
        """Test: Adiv bei 1m Entfernung = 11 dB."""
        result = calculator._geometric_divergence(1)
        assert result == pytest.approx(11.0, abs=0.1)

    def test_divergence_at_10m(self, calculator):
        """Test: Adiv bei 10m Entfernung = 31 dB."""
        result = calculator._geometric_divergence(10)
        expected = 20 * math.log10(10) + 11  # = 31 dB
        assert result == pytest.approx(expected, abs=0.1)

    def test_divergence_at_100m(self, calculator):
        """Test: Adiv bei 100m Entfernung ≈ 51 dB."""
        result = calculator._geometric_divergence(100)
        expected = 20 * math.log10(100) + 11  # = 51 dB
        assert result == pytest.approx(expected, abs=0.1)

    def test_divergence_at_1000m(self, calculator):
        """Test: Adiv bei 1km Entfernung = 71 dB."""
        result = calculator._geometric_divergence(1000)
        expected = 20 * math.log10(1000) + 11  # = 71 dB
        assert result == pytest.approx(expected, abs=0.1)

    def test_minimum_distance_clamping(self, calculator):
        """Test: Distanz unter 1m wird auf 1m gesetzt."""
        result_0 = calculator._geometric_divergence(0)
        result_05 = calculator._geometric_divergence(0.5)
        result_1 = calculator._geometric_divergence(1)

        assert result_0 == result_1
        assert result_05 == result_1

    def test_divergence_increases_with_distance(self, calculator):
        """Test: Dämpfung steigt mit Entfernung."""
        d1 = calculator._geometric_divergence(50)
        d2 = calculator._geometric_divergence(100)
        d3 = calculator._geometric_divergence(200)

        assert d1 < d2 < d3

    def test_6db_doubling_rule(self, calculator):
        """Test: +6 dB bei Verdopplung der Entfernung."""
        d1 = calculator._geometric_divergence(100)
        d2 = calculator._geometric_divergence(200)

        # Bei Verdopplung der Entfernung: +6 dB (20*log10(2) ≈ 6.02)
        assert d2 - d1 == pytest.approx(6.02, abs=0.1)


# =============================================================================
# Tests: Atmosphärische Absorption (Aatm)
# =============================================================================

class TestAtmosphericAbsorption:
    """Tests für die atmosphärische Absorption nach ISO 9613-2 Abschnitt 7.2."""

    def test_absorption_at_short_distance(self, calculator, typical_drone):
        """Test: Geringe Absorption bei kurzer Distanz."""
        result = calculator._atmospheric_absorption(100, False, typical_drone)
        # Bei 100m: ca. 0.2 dB (2 dB/km * 0.1 km)
        assert result == pytest.approx(0.2, abs=0.1)

    def test_absorption_at_1km(self, calculator, typical_drone):
        """Test: Absorption bei 1km Entfernung."""
        result = calculator._atmospheric_absorption(1000, False, typical_drone)
        # Bei 1000m: ca. 2 dB
        assert result == pytest.approx(2.0, abs=0.5)

    def test_absorption_increases_with_distance(self, calculator, typical_drone):
        """Test: Absorption steigt linear mit Entfernung."""
        a1 = calculator._atmospheric_absorption(500, False, typical_drone)
        a2 = calculator._atmospheric_absorption(1000, False, typical_drone)

        # Sollte ungefähr verdoppeln
        assert a2 == pytest.approx(2 * a1, abs=0.2)

    def test_octave_band_absorption(self, calculator, typical_drone):
        """Test: Oktavband-Berechnung liefert Wert."""
        result = calculator._atmospheric_absorption(500, True, typical_drone)
        assert result > 0


# =============================================================================
# Tests: Bodeneffekt (Agr)
# =============================================================================

class TestGroundEffect:
    """Tests für den Bodeneffekt nach ISO 9613-2 Abschnitt 7.3."""

    def test_ground_effect_hard_surface(self, calculator, typical_drone):
        """Test: Harter Boden (G=0) hat minimalen Effekt."""
        receiver = Receiver(x=100, y=0, z=4.0, ground_type=GroundType.HARD)
        result = calculator._ground_effect(typical_drone, receiver, 100)

        # Harter Boden: G=0, daher Agr ≈ 0
        assert result == pytest.approx(0.0, abs=0.5)

    def test_ground_effect_soft_surface(self, calculator, typical_drone):
        """Test: Weicher Boden (G=1) hat messbaren Effekt."""
        receiver = Receiver(x=100, y=0, z=4.0, ground_type=GroundType.SOFT)
        result = calculator._ground_effect(typical_drone, receiver, 100)

        # Weicher Boden sollte positiven Dämpfungswert haben
        assert result >= 0

    def test_ground_effect_mixed_surface(self, calculator, typical_drone):
        """Test: Gemischter Boden (G=0.5) liegt zwischen hart und weich."""
        receiver_mixed = Receiver(x=100, y=0, z=4.0, ground_type=GroundType.MIXED)
        receiver_hard = Receiver(x=100, y=0, z=4.0, ground_type=GroundType.HARD)
        receiver_soft = Receiver(x=100, y=0, z=4.0, ground_type=GroundType.SOFT)

        agr_mixed = calculator._ground_effect(typical_drone, receiver_mixed, 100)
        agr_hard = calculator._ground_effect(typical_drone, receiver_hard, 100)
        agr_soft = calculator._ground_effect(typical_drone, receiver_soft, 100)

        # Mixed sollte zwischen Hard und Soft liegen
        assert agr_hard <= agr_mixed <= agr_soft

    def test_ground_effect_high_source(self, calculator):
        """Test: Hohe Quelle reduziert Bodeneffekt."""
        high_source = NoiseSource(lw=75, x=0, y=0, z=100)
        low_source = NoiseSource(lw=75, x=0, y=0, z=20)
        receiver = Receiver(x=100, y=0, z=4.0, ground_type=GroundType.SOFT)

        agr_high = calculator._ground_effect(high_source, receiver, 100)
        agr_low = calculator._ground_effect(low_source, receiver, 100)

        # Hohe Quelle sollte weniger Bodeneffekt haben
        assert agr_high <= agr_low


# =============================================================================
# Tests: Abschirmung (Abar)
# =============================================================================

class TestBarrierAttenuation:
    """Tests für die Abschirmungsberechnung nach ISO 9613-2 Abschnitt 7.4."""

    def test_no_obstacles_no_attenuation(self, calculator, typical_drone, elevated_receiver):
        """Test: Keine Hindernisse = keine Abschirmung."""
        result = calculator._barrier_attenuation(typical_drone, elevated_receiver, [])
        assert result == 0.0

    def test_obstacle_between_source_and_receiver(self, calculator, typical_drone):
        """Test: Hindernis zwischen Quelle und Empfänger."""
        receiver = Receiver(x=100, y=0, z=4.0)
        obstacle = Obstacle(x=50, y=0, height=20, width=10, length=10)

        result = calculator._barrier_attenuation(typical_drone, receiver, [obstacle])

        # Sollte positive Dämpfung ergeben
        assert result >= 0

    def test_maximum_barrier_attenuation(self, calculator, typical_drone):
        """Test: Maximale Abschirmung ist 25 dB nach ISO 9613-2."""
        receiver = Receiver(x=200, y=0, z=2.0)
        # Großes Hindernis direkt auf dem Weg
        obstacle = Obstacle(x=100, y=0, height=50, width=100, length=100)

        result = calculator._barrier_attenuation(typical_drone, receiver, [obstacle])

        # Maximum nach ISO 9613-2 ist 25 dB
        assert result <= 25.0


# =============================================================================
# Tests: Gesamtberechnung
# =============================================================================

class TestFullCalculation:
    """Tests für die vollständige Schallpegelberechnung."""

    def test_basic_calculation(self, calculator, typical_drone, elevated_receiver):
        """Test: Grundberechnung liefert plausibles Ergebnis."""
        result = calculator.calculate(typical_drone, elevated_receiver)

        assert isinstance(result, AttenuationResult)
        assert result.source_lw == 75.0
        assert result.distance_m > 0
        assert result.sound_pressure_level < result.source_lw  # SPL < LW

    def test_calculation_at_various_distances(self, calculator, typical_drone):
        """Test: Schallpegel sinkt mit Entfernung."""
        distances = [50, 100, 200, 500]
        spls = []

        for d in distances:
            receiver = Receiver(x=d, y=0, z=4.0)
            result = calculator.calculate(typical_drone, receiver)
            spls.append(result.sound_pressure_level)

        # Jeder nachfolgende Pegel sollte niedriger sein
        for i in range(len(spls) - 1):
            assert spls[i] > spls[i + 1], f"SPL at {distances[i]}m should be higher than at {distances[i+1]}m"

    def test_result_contains_all_components(self, calculator, typical_drone, elevated_receiver):
        """Test: Ergebnis enthält alle Dämpfungskomponenten."""
        result = calculator.calculate(typical_drone, elevated_receiver)

        assert hasattr(result, 'a_div')
        assert hasattr(result, 'a_atm')
        assert hasattr(result, 'a_gr')
        assert hasattr(result, 'a_bar')
        assert hasattr(result, 'a_misc')
        assert hasattr(result, 'total_attenuation')
        assert hasattr(result, 'sound_pressure_level')

    def test_total_attenuation_sum(self, calculator, typical_drone, elevated_receiver):
        """Test: Gesamtdämpfung = Summe der Komponenten."""
        result = calculator.calculate(typical_drone, elevated_receiver)

        expected_total = result.a_div + result.a_atm + result.a_gr + result.a_bar + result.a_misc
        assert result.total_attenuation == pytest.approx(expected_total, abs=0.01)

    def test_spl_formula(self, calculator, typical_drone, elevated_receiver):
        """Test: LAT = LW + Dc - A."""
        result = calculator.calculate(typical_drone, elevated_receiver)

        expected_spl = typical_drone.lw + typical_drone.directivity - result.total_attenuation
        assert result.sound_pressure_level == pytest.approx(expected_spl, abs=0.01)

    def test_calculation_method_in_result(self, calculator, typical_drone, elevated_receiver):
        """Test: Berechnungsmethode ist dokumentiert."""
        result = calculator.calculate(typical_drone, elevated_receiver)

        assert result.calculation_method == "ISO 9613-2:1996"

    def test_to_dict_method(self, calculator, typical_drone, elevated_receiver):
        """Test: to_dict() liefert vollständiges Dictionary."""
        result = calculator.calculate(typical_drone, elevated_receiver)
        result_dict = result.to_dict()

        assert "source_lw_dba" in result_dict
        assert "distance_m" in result_dict
        assert "attenuation" in result_dict
        assert "result_spl_dba" in result_dict
        assert "method" in result_dict


# =============================================================================
# Tests: Grid-Berechnung
# =============================================================================

class TestGridCalculation:
    """Tests für die Rasterberechnung."""

    def test_grid_calculation(self, calculator, typical_drone):
        """Test: Grid-Berechnung liefert Punkte."""
        bbox = (-50, -50, 50, 50)
        results = calculator.calculate_grid(typical_drone, bbox, grid_size=25)

        assert len(results) > 0
        assert all('x' in r and 'y' in r and 'spl_dba' in r for r in results)

    def test_grid_point_count(self, calculator, typical_drone):
        """Test: Korrekte Anzahl von Rasterpunkten."""
        bbox = (0, 0, 100, 100)
        grid_size = 50
        results = calculator.calculate_grid(typical_drone, bbox, grid_size=grid_size)

        # Bei 100x100m und 50m Raster: 3x3 = 9 Punkte
        expected_points = 3 * 3
        assert len(results) == expected_points


# =============================================================================
# Tests: TA Lärm Compliance
# =============================================================================

class TestTALaermChecker:
    """Tests für die TA Lärm Grenzwertprüfung."""

    def test_residential_day_compliant(self):
        """Test: 50 dB in Wohngebiet (Tag) ist konform."""
        result = TALaermChecker.check_compliance(50, "allgemeines_wohngebiet", False)

        assert result["compliant"] is True
        assert result["limit"] == 55
        assert result["margin_db"] == 5.0
        assert result["status"] == "KONFORM"

    def test_residential_day_non_compliant(self):
        """Test: 60 dB in Wohngebiet (Tag) ist nicht konform."""
        result = TALaermChecker.check_compliance(60, "allgemeines_wohngebiet", False)

        assert result["compliant"] is False
        assert result["limit"] == 55
        assert result["margin_db"] == -5.0
        assert result["status"] == "ÜBERSCHREITUNG"

    def test_residential_night_stricter(self):
        """Test: Nachtgrenzwerte sind strenger."""
        result_day = TALaermChecker.check_compliance(45, "allgemeines_wohngebiet", False)
        result_night = TALaermChecker.check_compliance(45, "allgemeines_wohngebiet", True)

        assert result_day["compliant"] is True
        assert result_night["compliant"] is False  # Nachtgrenzwert ist 40 dB

    def test_industrial_zone_higher_limits(self):
        """Test: Industriegebiet hat höhere Grenzwerte."""
        result = TALaermChecker.check_compliance(65, "industriegebiet", False)

        assert result["compliant"] is True
        assert result["limit"] == 70

    def test_hospital_zone_lower_limits(self):
        """Test: Krankenhaus hat niedrigere Grenzwerte."""
        result = TALaermChecker.check_compliance(50, "krankenhaus", False)

        assert result["compliant"] is False  # Grenzwert ist 45 dB
        assert result["limit"] == 45

    def test_all_zone_types(self):
        """Test: Alle Gebietstypen sind definiert."""
        zone_types = [
            "industriegebiet",
            "gewerbegebiet",
            "kerngebiet",
            "mischgebiet",
            "allgemeines_wohngebiet",
            "reines_wohngebiet",
            "kurgebiet",
            "krankenhaus"
        ]

        for zone in zone_types:
            result = TALaermChecker.check_compliance(50, zone, False)
            assert "limit" in result
            assert "compliant" in result

    def test_unknown_zone_defaults_to_mischgebiet(self):
        """Test: Unbekannter Gebietstyp verwendet Mischgebiet-Grenzwerte."""
        result = TALaermChecker.check_compliance(55, "unknown_zone", False)

        assert result["limit"] == 60  # Mischgebiet Tag


# =============================================================================
# Tests: Edge Cases
# =============================================================================

class TestEdgeCases:
    """Tests für Grenzfälle und Fehlerbehandlung."""

    def test_very_short_distance(self, calculator, typical_drone):
        """Test: Sehr kurze Distanz löst Warnung aus."""
        receiver = Receiver(x=0.5, y=0, z=50)
        result = calculator.calculate(typical_drone, receiver)

        assert any("kurze Distanz" in note for note in result.notes) or \
               any("Nahfeld" in note for note in result.notes)

    def test_high_source_note(self, calculator):
        """Test: Hohe Quelle erzeugt Hinweis."""
        high_drone = NoiseSource(lw=75, x=0, y=0, z=150)
        receiver = Receiver(x=100, y=0, z=4.0)
        result = calculator.calculate(high_drone, receiver)

        # Sollte Hinweis über große Quellhöhe enthalten
        assert any("Quellhöhe" in note or "Höhe" in note for note in result.notes)

    def test_3d_distance_calculation(self, calculator):
        """Test: 3D-Distanzberechnung ist korrekt."""
        source = NoiseSource(lw=75, x=0, y=0, z=0)
        receiver = Receiver(x=3, y=4, z=0)

        # Pythagoras: sqrt(3² + 4²) = 5
        distance = calculator._calculate_distance(source, receiver)
        assert distance == pytest.approx(5.0, abs=0.01)

    def test_3d_distance_with_height(self, calculator):
        """Test: 3D-Distanzberechnung mit Höhendifferenz."""
        source = NoiseSource(lw=75, x=0, y=0, z=50)
        receiver = Receiver(x=30, y=40, z=0)

        # sqrt(30² + 40² + 50²) = sqrt(900 + 1600 + 2500) = sqrt(5000) ≈ 70.71
        distance = calculator._calculate_distance(source, receiver)
        assert distance == pytest.approx(70.71, abs=0.1)
