"""
Pydantic Schemas for MORPHEUS Certified Core
============================================

Validierte Datenmodelle für API und Berechnungen.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator
from enum import Enum


class ZoneType(str, Enum):
    """Gebietstypen nach TA Lärm."""
    INDUSTRIAL = "industriegebiet"
    COMMERCIAL = "gewerbegebiet"
    CORE = "kerngebiet"
    MIXED = "mischgebiet"
    RESIDENTIAL_GENERAL = "allgemeines_wohngebiet"
    RESIDENTIAL_PURE = "reines_wohngebiet"
    SPA = "kurgebiet"
    HOSPITAL = "krankenhaus"


class CoordinateSystem(str, Enum):
    """Unterstützte Koordinatensysteme."""
    EPSG_25832 = "EPSG:25832"  # UTM Zone 32N (Standard NRW)
    EPSG_4326 = "EPSG:4326"   # WGS84
    EPSG_3857 = "EPSG:3857"   # Web Mercator


class Point3D(BaseModel):
    """3D-Koordinate."""
    x: float = Field(..., description="X-Koordinate in Metern")
    y: float = Field(..., description="Y-Koordinate in Metern")
    z: float = Field(default=0.0, description="Höhe über Grund in Metern")
    srs: CoordinateSystem = Field(default=CoordinateSystem.EPSG_25832)


class BoundingBox(BaseModel):
    """Bounding Box für Abfragen."""
    min_x: float
    min_y: float
    max_x: float
    max_y: float
    srs: CoordinateSystem = Field(default=CoordinateSystem.EPSG_25832)

    @validator('max_x')
    def max_x_greater(self, v, values):
        if 'min_x' in values and v <= values['min_x']:
            raise ValueError('max_x muss größer als min_x sein')
        return v

    @validator('max_y')
    def max_y_greater(self, v, values):
        if 'min_y' in values and v <= values['min_y']:
            raise ValueError('max_y muss größer als min_y sein')
        return v


class DroneModel(BaseModel):
    """Drohnen-Spezifikation."""
    id: str = Field(..., description="Eindeutige Drohnen-ID")
    model: str = Field(..., description="Modellbezeichnung")
    manufacturer: str = Field(default="Auriol")

    # Akustische Eigenschaften
    sound_power_level_dba: float = Field(
        ...,
        ge=50, le=100,
        description="Schallleistungspegel LwA in dB(A)"
    )
    frequency_spectrum: Optional[Dict[int, float]] = Field(
        default=None,
        description="Oktavband-Spektrum {Hz: dB}"
    )

    # Flugeigenschaften
    max_speed_ms: float = Field(default=20.0, ge=0)
    typical_altitude_m: float = Field(default=50.0, ge=10, le=120)
    max_payload_kg: float = Field(default=2.5, ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "AUR-001",
                "model": "Auriol X5",
                "manufacturer": "Auriol",
                "sound_power_level_dba": 75.0,
                "max_speed_ms": 20.0,
                "typical_altitude_m": 50.0,
                "max_payload_kg": 2.5
            }
        }


class Waypoint(BaseModel):
    """Wegpunkt einer Flugroute."""
    position: Point3D
    timestamp: Optional[datetime] = None
    speed_ms: Optional[float] = Field(default=None, ge=0)


class FlightRoute(BaseModel):
    """Flugroute für Lärmberechnung."""
    id: str
    name: str
    drone_id: str
    waypoints: List[Waypoint] = Field(..., min_length=2)
    total_distance_m: Optional[float] = None
    estimated_duration_s: Optional[float] = None

    @validator('waypoints')
    def at_least_two_waypoints(self, v):
        if len(v) < 2:
            raise ValueError('Route muss mindestens 2 Wegpunkte haben')
        return v


class ImmissionsortInput(BaseModel):
    """Immissionsort für Lärmberechnung."""
    id: str
    name: str
    position: Point3D
    zone_type: ZoneType
    height_m: float = Field(default=4.0, ge=0, description="Höhe über Grund")
    is_sensitive: bool = Field(default=False, description="Sensible Nutzung (Krankenhaus, Schule)")


class NoiseCalculationRequest(BaseModel):
    """Request für Lärmberechnung."""
    route: FlightRoute
    drone: DroneModel
    immissionsorte: List[ImmissionsortInput]

    # Berechnungsoptionen
    calculation_method: Literal["iso9613-2", "simplified"] = Field(
        default="iso9613-2"
    )
    include_weather: bool = Field(default=True)
    weather_station_id: Optional[str] = None

    # Grid-Berechnung
    calculate_grid: bool = Field(default=False)
    grid_size_m: float = Field(default=10.0, ge=1, le=100)
    grid_bbox: Optional[BoundingBox] = None


class AttenuationComponents(BaseModel):
    """Dämpfungskomponenten nach ISO 9613-2."""
    geometric_div_db: float
    atmospheric_db: float
    ground_effect_db: float
    barrier_db: float
    misc_db: float
    total_db: float


class ImmissionsortResult(BaseModel):
    """Berechnungsergebnis für einen Immissionsort."""
    id: str
    name: str
    position: Point3D
    zone_type: ZoneType

    # Berechnete Werte
    distance_m: float
    sound_pressure_level_dba: float
    attenuation: AttenuationComponents

    # Compliance
    ta_laerm_limit_day_db: float
    ta_laerm_limit_night_db: float
    compliant_day: bool
    compliant_night: bool
    margin_day_db: float
    margin_night_db: float


class NoiseCalculationResult(BaseModel):
    """Vollständiges Ergebnis einer Lärmberechnung."""
    request_id: str
    timestamp: datetime
    calculation_method: str

    # Eingangsdaten
    route_id: str
    drone_id: str

    # Ergebnisse
    results: List[ImmissionsortResult]
    max_spl_dba: float
    min_spl_dba: float
    avg_spl_dba: float

    # Grid (optional)
    grid_results: Optional[List[Dict[str, Any]]] = None

    # Compliance-Zusammenfassung
    all_compliant_day: bool
    all_compliant_night: bool
    non_compliant_points: List[str]

    # Audit
    calculation_duration_ms: int
    data_sources: List[Dict[str, Any]]
    algorithm_version: str


class ComplianceReport(BaseModel):
    """Compliance-Bericht für Dokumentation."""
    report_id: str
    generated_at: datetime
    generated_by: str = Field(default="MORPHEUS Certified Core")

    # Zusammenfassung
    route_name: str
    drone_model: str
    calculation_date: datetime
    overall_compliance: bool

    # Details
    calculation_results: NoiseCalculationResult

    # Regulatorische Referenzen
    regulatory_framework: str = Field(default="TA Lärm 1998")
    calculation_standard: str = Field(default="ISO 9613-2:1996")

    # Unterschrift/Validierung
    certified: bool = Field(default=False)
    certifier_name: Optional[str] = None
    certification_date: Optional[datetime] = None
    certification_notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "report_id": "RPT-2024-001",
                "overall_compliance": True,
                "regulatory_framework": "TA Lärm 1998",
                "calculation_standard": "ISO 9613-2:1996"
            }
        }
