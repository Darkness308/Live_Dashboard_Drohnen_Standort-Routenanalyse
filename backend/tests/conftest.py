"""
Pytest Conftest - Shared Fixtures
=================================

Gemeinsame Fixtures für alle Tests.
"""

import pytest
import sys
from pathlib import Path

# Backend zum Python-Pfad hinzufügen
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))


@pytest.fixture(scope="session")
def sample_coordinates():
    """Standard-Koordinaten für Iserlohn."""
    return {
        "center": {"lat": 51.371099, "lng": 7.693150},
        "bbox_wgs84": (7.650000, 51.350000, 7.750000, 51.400000),
        "bbox_utm32": (400000, 5690000, 410000, 5700000)
    }


@pytest.fixture(scope="session")
def ta_laerm_limits():
    """TA Lärm Grenzwerte als Referenz."""
    return {
        "industriegebiet": {"day": 70, "night": 70},
        "gewerbegebiet": {"day": 65, "night": 50},
        "kerngebiet": {"day": 60, "night": 45},
        "mischgebiet": {"day": 60, "night": 45},
        "allgemeines_wohngebiet": {"day": 55, "night": 40},
        "reines_wohngebiet": {"day": 50, "night": 35},
        "kurgebiet": {"day": 45, "night": 35},
        "krankenhaus": {"day": 45, "night": 35}
    }


@pytest.fixture
def mock_geojson_response():
    """Mock GeoJSON Response für WFS-Tests."""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "test.1",
                "geometry": {
                    "type": "Point",
                    "coordinates": [7.693150, 51.371099]
                },
                "properties": {
                    "name": "Test Feature",
                    "value": 42
                }
            }
        ]
    }
