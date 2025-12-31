"""
MORPHEUS Backend API - Route Definitions
========================================

API-Endpoints für:
- /calculate/noise - ISO 9613-2 Lärmberechnung
- /calculate/grid - Rasterberechnung für Lärmkarten
- /compliance/check - TA Lärm Compliance-Prüfung
- /geodata/alkis - ALKIS Flurstücke
- /geodata/noise - Lärmkartierung
- /audit/trail - Audit-Log Abfrage
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field, validator

# Lokale Imports - relative Imports für Backend-Modul
try:
    from calculations.iso9613 import (
        GroundType,
        ISO9613Calculator,
        NoiseSource,
        Receiver,
        TALaermChecker,
        WeatherConditions,
    )
    from integrations.nrw_data_loader import NRWDataLoader
except ImportError:
    # Fallback für absolute Imports
    from backend.calculations.iso9613 import (
        GroundType,
        ISO9613Calculator,
        NoiseSource,
        Receiver,
        TALaermChecker,
        WeatherConditions,
    )
    from backend.integrations.nrw_data_loader import NRWDataLoader

# Optional: Pydantic Schemas (werden inline definiert falls nicht vorhanden)
try:
    pass
except ImportError:
    pass  # Verwende inline-definierte Models

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Pydantic Models für API
# =============================================================================


class GroundTypeEnum(str, Enum):
    """Bodentyp für Lärmberechnung."""

    HARD = "hard"
    SOFT = "soft"
    MIXED = "mixed"


class ZoneTypeEnum(str, Enum):
    """TA Lärm Gebietstypen."""

    INDUSTRIEGEBIET = "industriegebiet"
    GEWERBEGEBIET = "gewerbegebiet"
    KERNGEBIET = "kerngebiet"
    MISCHGEBIET = "mischgebiet"
    ALLGEMEINES_WOHNGEBIET = "allgemeines_wohngebiet"
    REINES_WOHNGEBIET = "reines_wohngebiet"
    KURGEBIET = "kurgebiet"
    KRANKENHAUS = "krankenhaus"


class NoiseSourceInput(BaseModel):
    """Schallquelle (Drohne) für API-Request."""

    lw_dba: float = Field(
        ..., ge=50, le=120, description="Schallleistungspegel in dB(A)"
    )
    x: float = Field(..., description="X-Koordinate (m)")
    y: float = Field(..., description="Y-Koordinate (m)")
    z: float = Field(..., ge=0, le=500, description="Höhe über Grund (m)")
    name: Optional[str] = Field("Drohne", description="Name der Quelle")
    directivity: float = Field(0.0, ge=-10, le=10, description="Richtwirkungsmaß (dB)")

    class Config:
        json_schema_extra = {
            "example": {
                "lw_dba": 75.0,
                "x": 0,
                "y": 0,
                "z": 50,
                "name": "Auriol X5",
                "directivity": 0.0,
            }
        }


class ReceiverInput(BaseModel):
    """Empfänger (Immissionsort) für API-Request."""

    x: float = Field(..., description="X-Koordinate (m)")
    y: float = Field(..., description="Y-Koordinate (m)")
    z: float = Field(4.0, ge=0, le=100, description="Höhe über Grund (m)")
    name: Optional[str] = Field("Immissionsort", description="Name des Empfängers")
    ground_type: GroundTypeEnum = Field(GroundTypeEnum.MIXED, description="Bodentyp")

    class Config:
        json_schema_extra = {
            "example": {
                "x": 100,
                "y": 0,
                "z": 4.0,
                "name": "Wohngebiet Friedenau",
                "ground_type": "mixed",
            }
        }


class WeatherInput(BaseModel):
    """Wetterbedingungen für Berechnung."""

    temperature_celsius: float = Field(
        15.0, ge=-40, le=50, description="Temperatur (°C)"
    )
    relative_humidity_percent: float = Field(
        70.0, ge=0, le=100, description="Rel. Luftfeuchtigkeit (%)"
    )
    atmospheric_pressure_hpa: float = Field(
        1013.25, ge=900, le=1100, description="Luftdruck (hPa)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "temperature_celsius": 20.0,
                "relative_humidity_percent": 70.0,
                "atmospheric_pressure_hpa": 1013.25,
            }
        }


class SingleCalculationRequest(BaseModel):
    """Request für einzelne Lärmberechnung."""

    source: NoiseSourceInput
    receiver: ReceiverInput
    weather: Optional[WeatherInput] = None
    use_octave_bands: bool = Field(False, description="Oktavband-Berechnung verwenden")

    class Config:
        json_schema_extra = {
            "example": {
                "source": {
                    "lw_dba": 75.0,
                    "x": 0,
                    "y": 0,
                    "z": 50,
                    "name": "Auriol X5",
                },
                "receiver": {
                    "x": 100,
                    "y": 0,
                    "z": 4.0,
                    "name": "Wohngebiet",
                    "ground_type": "soft",
                },
            }
        }


class CalculationResultResponse(BaseModel):
    """Response für Lärmberechnung."""

    source_lw_dba: float
    receiver_name: str
    distance_m: float
    attenuation: Dict[str, float]
    total_attenuation_db: float
    sound_pressure_level_dba: float
    calculation_method: str
    notes: List[str]
    timestamp: datetime


class GridCalculationInput(BaseModel):
    """Request für Rasterberechnung."""

    source: NoiseSourceInput
    bbox: Tuple[float, float, float, float] = Field(
        ..., description="BoundingBox (xmin, ymin, xmax, ymax)"
    )
    grid_size_m: int = Field(25, ge=5, le=100, description="Rastergröße in Metern")
    receiver_height_m: float = Field(4.0, ge=0, le=50, description="Empfängerhöhe")
    weather: Optional[WeatherInput] = None

    @validator("bbox")
    def validate_bbox(cls, v):
        xmin, ymin, xmax, ymax = v
        if xmin >= xmax or ymin >= ymax:
            raise ValueError("BBox: min-Werte müssen kleiner als max-Werte sein")
        if (xmax - xmin) > 2000 or (ymax - ymin) > 2000:
            raise ValueError("BBox zu groß: max 2000m x 2000m")
        return v


class GridResultResponse(BaseModel):
    """Response für Rasterberechnung."""

    source_name: str
    grid_size_m: int
    total_points: int
    min_spl_dba: float
    max_spl_dba: float
    avg_spl_dba: float
    grid_data: List[Dict[str, float]]
    timestamp: datetime


class TALaermCheckInput(BaseModel):
    """Request für TA Lärm Compliance-Check."""

    noise_level_dba: float = Field(
        ..., ge=0, le=150, description="Berechneter/gemessener Pegel"
    )
    zone_type: ZoneTypeEnum = Field(..., description="Gebietstyp nach TA Lärm")
    is_night: bool = Field(False, description="Nachtzeit (22:00-06:00)")

    class Config:
        json_schema_extra = {
            "example": {
                "noise_level_dba": 52.0,
                "zone_type": "allgemeines_wohngebiet",
                "is_night": False,
            }
        }


class TALaermResultResponse(BaseModel):
    """Response für TA Lärm Compliance-Check."""

    noise_level_dba: float
    zone_type: str
    time_period: str
    limit_dba: int
    margin_db: float
    compliant: bool
    status: str
    reference: str


class BBoxInput(BaseModel):
    """BoundingBox für Geodaten-Abfrage."""

    xmin: float = Field(..., description="Minimum X (Longitude)")
    ymin: float = Field(..., description="Minimum Y (Latitude)")
    xmax: float = Field(..., description="Maximum X (Longitude)")
    ymax: float = Field(..., description="Maximum Y (Latitude)")
    srs: str = Field("EPSG:4326", description="Koordinatenreferenzsystem")

    @validator("xmax")
    def validate_xmax(cls, v, values):
        if "xmin" in values and v <= values["xmin"]:
            raise ValueError("xmax muss größer als xmin sein")
        return v

    @validator("ymax")
    def validate_ymax(cls, v, values):
        if "ymin" in values and v <= values["ymin"]:
            raise ValueError("ymax muss größer als ymin sein")
        return v


# =============================================================================
# Dependencies
# =============================================================================


def get_calculator() -> ISO9613Calculator:
    """Dependency: ISO9613 Calculator."""
    return ISO9613Calculator()


def get_data_loader() -> NRWDataLoader:
    """Dependency: NRW Data Loader."""
    return NRWDataLoader()


# =============================================================================
# Noise Calculation Endpoints
# =============================================================================


@router.post(
    "/calculate/noise",
    response_model=CalculationResultResponse,
    tags=["Noise Calculation"],
    summary="ISO 9613-2 Lärmberechnung",
    description="""
    Berechnet den Schalldruckpegel am Empfänger nach ISO 9613-2:1996.

    **Dämpfungskomponenten:**
    - Adiv: Geometrische Ausbreitung
    - Aatm: Atmosphärische Absorption
    - Agr: Bodeneffekt
    - Abar: Abschirmung (falls Hindernisse angegeben)

    **Formel:** LAT = LW + Dc - A
    """,
)
async def calculate_noise(
    request: SingleCalculationRequest,
    calculator: ISO9613Calculator = Depends(get_calculator),
):
    """
    Berechnet Schallpegel für einzelne Quelle-Empfänger-Kombination.
    """
    try:
        # Source erstellen
        source = NoiseSource(
            lw=request.source.lw_dba,
            x=request.source.x,
            y=request.source.y,
            z=request.source.z,
            name=request.source.name,
            directivity=request.source.directivity,
        )

        # Receiver erstellen mit validiertem Bodentyp-Mapping
        ground_type_map = {
            GroundTypeEnum.HARD: GroundType.HARD,
            GroundTypeEnum.SOFT: GroundType.SOFT,
            GroundTypeEnum.MIXED: GroundType.MIXED,
        }
        mapped_ground_type = ground_type_map.get(
            request.receiver.ground_type, GroundType.MIXED
        )
        receiver = Receiver(
            x=request.receiver.x,
            y=request.receiver.y,
            z=request.receiver.z,
            name=request.receiver.name,
            ground_type=mapped_ground_type,
        )

        # Weather (optional)
        if request.weather:
            weather = WeatherConditions(
                temperature_celsius=request.weather.temperature_celsius,
                relative_humidity_percent=request.weather.relative_humidity_percent,
                atmospheric_pressure_hpa=request.weather.atmospheric_pressure_hpa,
            )
            calculator = ISO9613Calculator(weather=weather)

        # Berechnung durchführen
        result = calculator.calculate(
            source, receiver, octave_bands=request.use_octave_bands
        )

        return CalculationResultResponse(
            source_lw_dba=result.source_lw,
            receiver_name=request.receiver.name or "Immissionsort",
            distance_m=result.distance_m,
            attenuation={
                "a_div_db": result.a_div,
                "a_atm_db": result.a_atm,
                "a_gr_db": result.a_gr,
                "a_bar_db": result.a_bar,
                "a_misc_db": result.a_misc,
            },
            total_attenuation_db=result.total_attenuation,
            sound_pressure_level_dba=result.sound_pressure_level,
            calculation_method=result.calculation_method,
            notes=result.notes,
            timestamp=datetime.now(),
        )

    except Exception as e:
        logger.error(f"Calculation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/calculate/grid",
    response_model=GridResultResponse,
    tags=["Noise Calculation"],
    summary="Rasterberechnung für Lärmkarte",
    description="""
    Berechnet Schallpegel auf einem Raster für Lärmkarten-Visualisierung.

    **Parameter:**
    - bbox: BoundingBox für Berechnungsbereich (max 2000m x 2000m)
    - grid_size_m: Abstand zwischen Rasterpunkten
    - receiver_height_m: Höhe der virtuellen Empfänger

    **Ausgabe:** Liste von Punkten mit (x, y, spl_dba)
    """,
)
async def calculate_grid(
    request: GridCalculationInput,
    calculator: ISO9613Calculator = Depends(get_calculator),
):
    """
    Berechnet Lärmraster für Visualisierung.
    """
    try:
        # Source erstellen
        source = NoiseSource(
            lw=request.source.lw_dba,
            x=request.source.x,
            y=request.source.y,
            z=request.source.z,
            name=request.source.name,
        )

        # Grid berechnen
        results = calculator.calculate_grid(
            source=source,
            bbox=request.bbox,
            grid_size=request.grid_size_m,
            receiver_height=request.receiver_height_m,
        )

        # Statistiken
        spls = [r["spl_dba"] for r in results]

        return GridResultResponse(
            source_name=request.source.name or "Drohne",
            grid_size_m=request.grid_size_m,
            total_points=len(results),
            min_spl_dba=min(spls) if spls else 0,
            max_spl_dba=max(spls) if spls else 0,
            avg_spl_dba=sum(spls) / len(spls) if spls else 0,
            grid_data=results,
            timestamp=datetime.now(),
        )

    except Exception as e:
        logger.error(f"Grid calculation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# TA Lärm Compliance Endpoints
# =============================================================================


@router.post(
    "/compliance/check",
    response_model=TALaermResultResponse,
    tags=["Noise Calculation"],
    summary="TA Lärm Compliance-Prüfung",
    description="""
    Prüft Einhaltung der TA Lärm Grenzwerte.

    **Grenzwerte (Tag / Nacht):**
    - Industriegebiet: 70 / 70 dB(A)
    - Gewerbegebiet: 65 / 50 dB(A)
    - Mischgebiet: 60 / 45 dB(A)
    - Allg. Wohngebiet: 55 / 40 dB(A)
    - Reines Wohngebiet: 50 / 35 dB(A)
    - Kurgebiet/Krankenhaus: 45 / 35 dB(A)
    """,
)
async def check_ta_laerm_compliance(request: TALaermCheckInput):
    """
    Prüft TA Lärm Compliance für gegebenen Pegel und Gebietstyp.
    """
    result = TALaermChecker.check_compliance(
        spl=request.noise_level_dba,
        zone_type=request.zone_type.value,
        is_night=request.is_night,
    )

    return TALaermResultResponse(
        noise_level_dba=request.noise_level_dba,
        zone_type=request.zone_type.value,
        time_period="Nacht (22:00-06:00)" if request.is_night else "Tag (06:00-22:00)",
        limit_dba=result["limit"],
        margin_db=result["margin_db"],
        compliant=result["compliant"],
        status=result["status"],
        reference="TA Lärm 1998, Nr. 6.1",
    )


@router.get(
    "/compliance/limits",
    tags=["Noise Calculation"],
    summary="TA Lärm Grenzwerte",
    description="Gibt alle TA Lärm Grenzwerte zurück.",
)
async def get_ta_laerm_limits():
    """
    Liefert alle TA Lärm Grenzwerte als Referenz.
    """
    return {
        "source": "TA Lärm 1998, Nr. 6.1",
        "limits": {
            "industriegebiet": {"day": 70, "night": 70},
            "gewerbegebiet": {"day": 65, "night": 50},
            "kerngebiet": {"day": 60, "night": 45},
            "mischgebiet": {"day": 60, "night": 45},
            "allgemeines_wohngebiet": {"day": 55, "night": 40},
            "reines_wohngebiet": {"day": 50, "night": 35},
            "kurgebiet": {"day": 45, "night": 35},
            "krankenhaus": {"day": 45, "night": 35},
        },
        "time_periods": {"day": "06:00-22:00", "night": "22:00-06:00"},
        "unit": "dB(A)",
    }


# =============================================================================
# Geodata Endpoints
# =============================================================================


@router.post(
    "/geodata/alkis",
    tags=["Geodata"],
    summary="ALKIS Flurstücke laden",
    description="""
    Lädt ALKIS Flurstücksdaten vom Geoportal NRW WFS.

    **Datenquelle:** wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht

    **Wichtig:** Koordinaten müssen im angegebenen SRS liegen.
    Standard ist EPSG:4326 (WGS84).
    """,
)
async def load_alkis_data(
    bbox: BBoxInput,
    background_tasks: BackgroundTasks,
    loader: NRWDataLoader = Depends(get_data_loader),
):
    """
    Lädt ALKIS Flurstücke für BoundingBox.
    """
    try:
        result = loader.load_alkis_data(
            bbox=(bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax), srs=bbox.srs
        )

        # Audit-Log wird intern in load_alkis_data geschrieben

        return {
            "status": "success",
            "bbox": {
                "xmin": bbox.xmin,
                "ymin": bbox.ymin,
                "xmax": bbox.xmax,
                "ymax": bbox.ymax,
                "srs": bbox.srs,
            },
            "data": result,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"ALKIS load error: {e}")
        raise HTTPException(status_code=502, detail=f"WFS Error: {str(e)}")


@router.post(
    "/geodata/noise",
    tags=["Geodata"],
    summary="Lärmkartierung laden",
    description="""
    Lädt Lärmkartierungsdaten vom Geoportal NRW WFS.

    **Datenquelle:** wfs.nrw.de/umwelt/laermkartierung

    **Lärmarten:**
    - strasse: Straßenverkehrslärm
    - schiene: Schienenverkehrslärm
    - industrie: Industrielärm
    """,
)
async def load_noise_mapping(
    bbox: BBoxInput,
    noise_type: str = Query(
        "strasse", description="Lärmtyp: strasse, schiene, industrie"
    ),
    background_tasks: BackgroundTasks = None,
    loader: NRWDataLoader = Depends(get_data_loader),
):
    """
    Lädt Lärmkartierungsdaten für BoundingBox.
    """
    try:
        result = loader.load_noise_data(
            bbox=(bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax), noise_type=noise_type
        )

        # Audit-Log wird intern in load_noise_data geschrieben

        return {
            "status": "success",
            "noise_type": noise_type,
            "bbox": {
                "xmin": bbox.xmin,
                "ymin": bbox.ymin,
                "xmax": bbox.xmax,
                "ymax": bbox.ymax,
            },
            "data": result,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Noise mapping load error: {e}")
        raise HTTPException(status_code=502, detail=f"WFS Error: {str(e)}")


@router.get(
    "/geodata/services/status",
    tags=["Geodata"],
    summary="WFS Service Status",
    description="Prüft Verfügbarkeit der Geoportal NRW WFS-Dienste.",
)
async def check_wfs_services(loader: NRWDataLoader = Depends(get_data_loader)):
    """
    Prüft Verfügbarkeit aller WFS-Dienste.
    """
    status = loader.check_service_availability()

    return {"timestamp": datetime.now().isoformat(), "services": status}


# =============================================================================
# Audit Endpoints
# =============================================================================


@router.get(
    "/audit/trail",
    tags=["Audit"],
    summary="Audit-Trail abrufen",
    description="""
    Gibt den gerichtsfesten Audit-Trail zurück.

    **Enthält für jede Datenabfrage:**
    - Zeitstempel
    - Datenquelle
    - Endpoint URL
    - Query-Parameter
    - Response-Hash (SHA256)
    - Erfolg/Fehler
    """,
)
async def get_audit_trail(
    limit: int = Query(100, ge=1, le=1000, description="Maximale Anzahl Einträge"),
    data_source: Optional[str] = Query(None, description="Filter nach Datenquelle"),
    loader: NRWDataLoader = Depends(get_data_loader),
):
    """
    Gibt Audit-Trail zurück.
    """
    records = loader.audit_records[-limit:]

    if data_source:
        records = [r for r in records if r.data_source.value == data_source]

    return {
        "total_records": len(records),
        "records": [
            {
                "timestamp": r.timestamp.isoformat(),
                "data_source": r.data_source.value,
                "endpoint_url": r.endpoint_url,
                "query_parameters": r.query_parameters,
                "response_hash": r.response_hash,
                "record_count": r.record_count,
                "processing_time_ms": r.processing_time_ms,
                "success": r.success,
                "error_message": r.error_message,
            }
            for r in records
        ],
    }


@router.get(
    "/audit/verify/{response_hash}",
    tags=["Audit"],
    summary="Response-Hash verifizieren",
    description="Verifiziert einen Response-Hash aus dem Audit-Trail.",
)
async def verify_audit_hash(
    response_hash: str, loader: NRWDataLoader = Depends(get_data_loader)
):
    """
    Sucht Audit-Record mit gegebenem Hash.
    """
    for record in loader.audit_records:
        if record.response_hash == response_hash:
            return {
                "verified": True,
                "record": {
                    "timestamp": record.timestamp.isoformat(),
                    "data_source": record.data_source.value,
                    "endpoint_url": record.endpoint_url,
                    "success": record.success,
                },
            }

    return {"verified": False, "message": "Hash not found in audit trail"}


# ============================================================================
# FRONTEND DATA ENDPOINTS
# ============================================================================


# Demo-Daten für Routen (würden in Produktion aus DB kommen)
DEMO_ROUTES = [
    {
        "id": "route_a",
        "name": "Route A - Optimierte Lärmreduzierung",
        "name_en": "Route A - Optimized Noise Reduction",
        "description": "Umfahrt über Gewerbegebiet, minimale Wohngebietsexposition",
        "color": "#EF4444",
        "distance_km": 12.3,
        "duration_min": 8,
        "noise_exposure_db": 48,
        "energy_consumption_percent": 75,
        "ta_compliant": True,
        "waypoints": [
            {"lat": 52.4800, "lng": 13.3500, "alt": 50},
            {"lat": 52.4850, "lng": 13.3600, "alt": 55},
            {"lat": 52.4900, "lng": 13.3700, "alt": 50},
            {"lat": 52.4950, "lng": 13.3800, "alt": 45},
            {"lat": 52.5000, "lng": 13.3850, "alt": 40},
        ],
    },
    {
        "id": "route_b",
        "name": "Route B - Standardroute",
        "name_en": "Route B - Standard Route",
        "description": "Direkter Weg, moderate Lärmbelastung",
        "color": "#3B82F6",
        "distance_km": 9.8,
        "duration_min": 6,
        "noise_exposure_db": 55,
        "energy_consumption_percent": 65,
        "ta_compliant": True,
        "waypoints": [
            {"lat": 52.4800, "lng": 13.3500, "alt": 50},
            {"lat": 52.4870, "lng": 13.3650, "alt": 50},
            {"lat": 52.4940, "lng": 13.3780, "alt": 50},
            {"lat": 52.5000, "lng": 13.3850, "alt": 40},
        ],
    },
    {
        "id": "route_c",
        "name": "Route C - Schnellroute",
        "name_en": "Route C - Fast Route",
        "description": "Kürzester Weg, höhere Lärmbelastung",
        "color": "#10B981",
        "distance_km": 8.2,
        "duration_min": 5,
        "noise_exposure_db": 62,
        "energy_consumption_percent": 58,
        "ta_compliant": False,
        "waypoints": [
            {"lat": 52.4800, "lng": 13.3500, "alt": 50},
            {"lat": 52.4900, "lng": 13.3675, "alt": 50},
            {"lat": 52.5000, "lng": 13.3850, "alt": 40},
        ],
    },
]

# Demo-Daten für Drohnen
DEMO_DRONES = [
    {
        "id": "AUR-001",
        "name": "Auriol Alpha",
        "model": "Auriol X5",
        "status": "active",
        "battery_percent": 78,
        "position": {"lat": 52.4850, "lng": 13.3620, "alt": 55},
        "destination": "Charité Mitte",
        "eta_minutes": 4,
        "current_route": "route_a",
        "flights_today": 12,
        "payload_kg": 1.5,
    },
    {
        "id": "AUR-002",
        "name": "Auriol Beta",
        "model": "Auriol X5",
        "status": "active",
        "battery_percent": 92,
        "position": {"lat": 52.4920, "lng": 13.3750, "alt": 50},
        "destination": "Vivantes Neukölln",
        "eta_minutes": 6,
        "current_route": "route_b",
        "flights_today": 8,
        "payload_kg": 2.0,
    },
    {
        "id": "AUR-003",
        "name": "Auriol Gamma",
        "model": "Auriol X5",
        "status": "charging",
        "battery_percent": 35,
        "position": None,
        "destination": None,
        "eta_minutes": None,
        "current_route": None,
        "flights_today": 15,
        "payload_kg": 0,
    },
    {
        "id": "AUR-004",
        "name": "Auriol Delta",
        "model": "Auriol X5",
        "status": "maintenance",
        "battery_percent": 100,
        "position": None,
        "destination": None,
        "eta_minutes": None,
        "current_route": None,
        "flights_today": 0,
        "payload_kg": 0,
    },
    {
        "id": "AUR-005",
        "name": "Auriol Epsilon",
        "model": "Auriol X5",
        "status": "active",
        "battery_percent": 65,
        "position": {"lat": 52.4780, "lng": 13.3580, "alt": 45},
        "destination": "DRK Westend",
        "eta_minutes": 3,
        "current_route": "route_a",
        "flights_today": 10,
        "payload_kg": 1.8,
    },
]

# Demo-Daten für Immissionsorte
DEMO_IMMISSIONSORTE = [
    {
        "id": "io_001",
        "name": "Wohngebiet Friedenau",
        "type": "allgemeines_wohngebiet",
        "coordinates": {"lat": 52.4650, "lng": 13.3350},
        "current_level_db": 52,
        "limit_day_db": 55,
        "limit_night_db": 40,
        "compliant": True,
        "distance_to_route_m": 85,
        "flights_per_hour": 5,
        "complaints_30d": 0,
    },
    {
        "id": "io_002",
        "name": "Schule Am Park",
        "type": "kurgebiet",
        "coordinates": {"lat": 52.4720, "lng": 13.3280},
        "current_level_db": 48,
        "limit_day_db": 45,
        "limit_night_db": 35,
        "compliant": False,
        "distance_to_route_m": 120,
        "flights_per_hour": 4,
        "complaints_30d": 2,
    },
    {
        "id": "io_003",
        "name": "Seniorenheim Lichterfelde",
        "type": "krankenhaus",
        "coordinates": {"lat": 52.4580, "lng": 13.3120},
        "current_level_db": 44,
        "limit_day_db": 45,
        "limit_night_db": 35,
        "compliant": True,
        "distance_to_route_m": 200,
        "flights_per_hour": 3,
        "complaints_30d": 0,
    },
    {
        "id": "io_004",
        "name": "Mischgebiet Steglitz",
        "type": "mischgebiet",
        "coordinates": {"lat": 52.4550, "lng": 13.3420},
        "current_level_db": 58,
        "limit_day_db": 60,
        "limit_night_db": 45,
        "compliant": True,
        "distance_to_route_m": 45,
        "flights_per_hour": 8,
        "complaints_30d": 1,
    },
    {
        "id": "io_005",
        "name": "Gewerbegebiet Tempelhof",
        "type": "gewerbegebiet",
        "coordinates": {"lat": 52.4720, "lng": 13.3680},
        "current_level_db": 62,
        "limit_day_db": 65,
        "limit_night_db": 50,
        "compliant": True,
        "distance_to_route_m": 30,
        "flights_per_hour": 12,
        "complaints_30d": 0,
    },
]


@router.get(
    "/routes",
    tags=["Routes"],
    summary="Alle Routen abrufen",
    description="Gibt alle verfügbaren Drohnen-Routen zurück.",
)
async def get_routes():
    """Gibt alle verfügbaren Routen zurück."""
    return {
        "routes": DEMO_ROUTES,
        "count": len(DEMO_ROUTES),
        "timestamp": datetime.now().isoformat(),
    }


@router.get(
    "/routes/{route_id}",
    tags=["Routes"],
    summary="Route nach ID abrufen",
    description="Gibt eine spezifische Route anhand ihrer ID zurück.",
)
async def get_route(route_id: str):
    """Gibt eine spezifische Route zurück."""
    for route in DEMO_ROUTES:
        if route["id"] == route_id:
            return route
    raise HTTPException(status_code=404, detail=f"Route '{route_id}' not found")


@router.get(
    "/drones",
    tags=["Fleet"],
    summary="Alle Drohnen abrufen",
    description="Gibt den Status aller registrierten Drohnen zurück.",
)
async def get_drones():
    """Gibt alle registrierten Drohnen zurück."""
    # Berechne Flotten-Statistiken
    active = sum(1 for d in DEMO_DRONES if d["status"] == "active")
    charging = sum(1 for d in DEMO_DRONES if d["status"] == "charging")
    maintenance = sum(1 for d in DEMO_DRONES if d["status"] == "maintenance")

    return {
        "drones": DEMO_DRONES,
        "count": len(DEMO_DRONES),
        "statistics": {
            "active": active,
            "charging": charging,
            "maintenance": maintenance,
            "total_flights_today": sum(d["flights_today"] for d in DEMO_DRONES),
        },
        "timestamp": datetime.now().isoformat(),
    }


@router.get(
    "/immissionsorte",
    tags=["Noise Monitoring"],
    summary="Alle Immissionsorte abrufen",
    description="Gibt alle Lärm-Messpunkte mit aktuellem Status zurück.",
)
async def get_immissionsorte():
    """Gibt alle Immissionsorte zurück."""
    compliant = sum(1 for io in DEMO_IMMISSIONSORTE if io["compliant"])

    return {
        "immissionsorte": DEMO_IMMISSIONSORTE,
        "count": len(DEMO_IMMISSIONSORTE),
        "statistics": {
            "compliant": compliant,
            "non_compliant": len(DEMO_IMMISSIONSORTE) - compliant,
            "total_complaints_30d": sum(io["complaints_30d"] for io in DEMO_IMMISSIONSORTE),
        },
        "timestamp": datetime.now().isoformat(),
    }


@router.get(
    "/config",
    tags=["Configuration"],
    summary="Frontend-Konfiguration abrufen",
    description="Gibt Konfigurationswerte für das Frontend zurück.",
)
async def get_config():
    """Gibt Frontend-Konfiguration zurück."""
    return {
        "version": "1.0.0",
        "features": {
            "3d_visualization": True,
            "live_tracking": True,
            "noise_heatmap": True,
            "route_optimization": True,
            "audit_trail": True,
        },
        "limits": {
            "max_routes": 10,
            "max_grid_size": 2000,
            "websocket_timeout_ms": 30000,
        },
        "map": {
            "default_center": {"lat": 52.48, "lng": 13.35},
            "default_zoom": 13,
            "max_zoom": 19,
        },
        "ta_laerm_limits": TALaermChecker.LIMITS,
        "timestamp": datetime.now().isoformat(),
    }
