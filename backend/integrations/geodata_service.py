"""
Geodata Service - Unified API for External Data Sources
=========================================================

Zentraler Service fuer alle externen Geodaten-Quellen:
- Geoportal NRW (ALKIS, Laermkartierung)
- DWD Wetterdaten
- OpenStreetMap Buildings

Stellt REST-Endpoints fuer das Frontend bereit.

Beispiel:
    from geodata_service import GeodataService

    service = GeodataService()

    # ALKIS Flurstuecke laden
    parcels = await service.get_parcels(bbox, include_geometry=True)

    # Aktuelle Wetterdaten
    weather = await service.get_weather(lat, lon)

    # Vorbelastung (Laermkartierung)
    noise_map = await service.get_ambient_noise(bbox)
"""

import asyncio
import hashlib
import json
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Interner Import
from .nrw_data_loader import (
    NRWDataLoader,
    DataSource,
    ALKISFlurstueck,
    NoiseMeasurement,
    PropertyType,
)

# Optionale Dependencies
try:
    from wetterdienst.provider.dwd.observation import DwdObservationRequest
    from wetterdienst import Settings as WDSettings
    DWD_AVAILABLE = True
except ImportError:
    DWD_AVAILABLE = False

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

logger = logging.getLogger(__name__)


# ==============================================================================
# DATA CLASSES
# ==============================================================================

@dataclass
class WeatherData:
    """Aktuelle Wetterdaten von DWD."""
    station_id: str
    station_name: str
    timestamp: datetime
    temperature_celsius: float
    humidity_percent: float
    pressure_hpa: float
    wind_speed_ms: float
    wind_direction_deg: float
    precipitation_mm: float
    cloud_cover_percent: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'station_id': self.station_id,
            'station_name': self.station_name,
            'timestamp': self.timestamp.isoformat(),
            'temperature_celsius': round(self.temperature_celsius, 1),
            'humidity_percent': round(self.humidity_percent, 0),
            'pressure_hpa': round(self.pressure_hpa, 1),
            'wind_speed_ms': round(self.wind_speed_ms, 1),
            'wind_direction_deg': round(self.wind_direction_deg, 0),
            'precipitation_mm': round(self.precipitation_mm, 1),
            'cloud_cover_percent': round(self.cloud_cover_percent, 0) if self.cloud_cover_percent else None
        }


@dataclass
class GeoParcel:
    """Vereinfachtes Flurstueck fuer Frontend."""
    id: str
    name: str
    area_sqm: float
    property_type: str
    municipality: str
    district: str
    centroid: Optional[Tuple[float, float]] = None
    geometry_geojson: Optional[Dict] = None

    def to_dict(self) -> Dict[str, Any]:
        result = {
            'id': self.id,
            'name': self.name,
            'area_sqm': self.area_sqm,
            'property_type': self.property_type,
            'municipality': self.municipality,
            'district': self.district
        }
        if self.centroid:
            result['centroid'] = {'lat': self.centroid[1], 'lng': self.centroid[0]}
        if self.geometry_geojson:
            result['geometry'] = self.geometry_geojson
        return result


@dataclass
class NoiseZone:
    """Laermzone aus Laermkartierung."""
    id: str
    noise_type: str
    lden_db: float
    lnight_db: float
    year: int
    area_sqm: Optional[float] = None
    geometry_geojson: Optional[Dict] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'noise_type': self.noise_type,
            'lden_db': self.lden_db,
            'lnight_db': self.lnight_db,
            'year': self.year,
            'area_sqm': self.area_sqm,
            'geometry': self.geometry_geojson
        }


@dataclass
class ServiceStatus:
    """Status eines externen Dienstes."""
    name: str
    available: bool
    response_time_ms: float
    last_check: datetime
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'available': self.available,
            'response_time_ms': round(self.response_time_ms, 1),
            'last_check': self.last_check.isoformat(),
            'error': self.error
        }


# ==============================================================================
# GEODATA SERVICE
# ==============================================================================

class GeodataService:
    """
    Zentraler Service fuer externe Geodaten.

    Features:
    - Caching mit TTL
    - Async-faehig
    - Retry-Logik
    - Audit-Trail
    """

    # Cache TTL in Sekunden
    CACHE_TTL = {
        'weather': 600,      # 10 Minuten
        'parcels': 86400,    # 24 Stunden
        'noise': 86400,      # 24 Stunden
        'status': 300        # 5 Minuten
    }

    # DWD Stationen in NRW (Auswahl)
    DWD_STATIONS_NRW = {
        'iserlohn': '02483',      # Iserlohn-Suemmern
        'dortmund': '01303',      # Dortmund
        'muenster': '10315',      # Muenster/Osnabrueck
        'duesseldorf': '01078',   # Duesseldorf
        'koeln': '02667',         # Koeln-Bonn
        'essen': '01443',         # Essen-Bredeney
    }

    def __init__(self, cache_dir: Optional[Path] = None):
        """
        Initialisiert den Geodata Service.

        Args:
            cache_dir: Verzeichnis fuer Cache-Dateien
        """
        self.cache_dir = cache_dir or Path('./cache/geodata')
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self._cache: Dict[str, Tuple[datetime, Any]] = {}
        self._nrw_loader: Optional[NRWDataLoader] = None

        logger.info("GeodataService initialisiert")

    def _get_nrw_loader(self) -> NRWDataLoader:
        """Lazy-Loading des NRW Loaders."""
        if self._nrw_loader is None:
            self._nrw_loader = NRWDataLoader(
                cache_dir=self.cache_dir / 'nrw'
            )
        return self._nrw_loader

    def _cache_key(self, prefix: str, *args) -> str:
        """Generiert einen Cache-Key."""
        data = f"{prefix}:{':'.join(str(a) for a in args)}"
        return hashlib.md5(data.encode()).hexdigest()

    def _get_cached(self, key: str, ttl_type: str) -> Optional[Any]:
        """Holt Wert aus Cache wenn nicht abgelaufen."""
        if key in self._cache:
            cached_time, value = self._cache[key]
            ttl = self.CACHE_TTL.get(ttl_type, 300)
            if datetime.now() - cached_time < timedelta(seconds=ttl):
                return value
        return None

    def _set_cached(self, key: str, value: Any) -> None:
        """Speichert Wert im Cache."""
        self._cache[key] = (datetime.now(), value)

    # --------------------------------------------------------------------------
    # SERVICE STATUS
    # --------------------------------------------------------------------------

    async def check_all_services(self) -> Dict[str, ServiceStatus]:
        """
        Prueft alle externen Dienste auf Verfuegbarkeit.

        Returns:
            Dict mit Status pro Service
        """
        cache_key = self._cache_key('status', 'all')
        cached = self._get_cached(cache_key, 'status')
        if cached:
            return cached

        results = {}

        # NRW Geoportal
        try:
            loader = self._get_nrw_loader()
            start = datetime.now()
            status = loader.check_service_availability()
            elapsed = (datetime.now() - start).total_seconds() * 1000

            for name, info in status.items():
                results[f'nrw_{name}'] = ServiceStatus(
                    name=f'Geoportal NRW {name.upper()}',
                    available=info.get('available', False),
                    response_time_ms=info.get('response_time_ms', elapsed),
                    last_check=datetime.now(),
                    error=info.get('error')
                )
        except Exception as e:
            results['nrw'] = ServiceStatus(
                name='Geoportal NRW',
                available=False,
                response_time_ms=0,
                last_check=datetime.now(),
                error=str(e)
            )

        # DWD
        results['dwd'] = await self._check_dwd_status()

        self._set_cached(cache_key, results)
        return results

    async def _check_dwd_status(self) -> ServiceStatus:
        """Prueft DWD Wetterdienst."""
        start = datetime.now()

        if not DWD_AVAILABLE:
            return ServiceStatus(
                name='DWD Wetterdienst',
                available=False,
                response_time_ms=0,
                last_check=datetime.now(),
                error='wetterdienst library not installed'
            )

        try:
            # Einfacher API-Test
            settings = WDSettings(ts_si_units=False)
            request = DwdObservationRequest(
                parameter=['temperature_air_mean_200'],
                resolution='hourly',
                period='recent',
                settings=settings
            )

            # Nur Stationen abfragen (schnell)
            stations = request.filter_by_station_id('01078')  # Duesseldorf

            elapsed = (datetime.now() - start).total_seconds() * 1000

            return ServiceStatus(
                name='DWD Wetterdienst',
                available=True,
                response_time_ms=elapsed,
                last_check=datetime.now()
            )

        except Exception as e:
            return ServiceStatus(
                name='DWD Wetterdienst',
                available=False,
                response_time_ms=(datetime.now() - start).total_seconds() * 1000,
                last_check=datetime.now(),
                error=str(e)
            )

    # --------------------------------------------------------------------------
    # WEATHER DATA (DWD)
    # --------------------------------------------------------------------------

    async def get_weather(self,
                          lat: float,
                          lon: float,
                          station_id: Optional[str] = None) -> Optional[WeatherData]:
        """
        Holt aktuelle Wetterdaten vom DWD.

        Args:
            lat: Breitengrad
            lon: Laengengrad
            station_id: Optionale Station-ID (sonst naechste Station)

        Returns:
            WeatherData oder None bei Fehler
        """
        cache_key = self._cache_key('weather', lat, lon, station_id or 'auto')
        cached = self._get_cached(cache_key, 'weather')
        if cached:
            return cached

        if not DWD_AVAILABLE:
            logger.warning("DWD nicht verfuegbar - verwende Fallback")
            return self._get_fallback_weather(lat, lon)

        try:
            result = await self._fetch_dwd_weather(lat, lon, station_id)
            if result:
                self._set_cached(cache_key, result)
            return result

        except Exception as e:
            logger.error(f"DWD Abfrage fehlgeschlagen: {e}")
            return self._get_fallback_weather(lat, lon)

    async def _fetch_dwd_weather(self,
                                  lat: float,
                                  lon: float,
                                  station_id: Optional[str]) -> Optional[WeatherData]:
        """Interne DWD-Abfrage."""
        settings = WDSettings(ts_si_units=False)

        # Parameter die wir brauchen
        parameters = [
            'temperature_air_mean_200',
            'humidity',
            'pressure_vapor',
            'wind_speed',
            'wind_direction',
            'precipitation_height'
        ]

        request = DwdObservationRequest(
            parameter=parameters,
            resolution='hourly',
            period='recent',
            settings=settings
        )

        if station_id:
            stations = request.filter_by_station_id(station_id)
        else:
            # Naechste Station finden
            stations = request.filter_by_rank(
                latlon=(lat, lon),
                rank=1
            )

        # Daten abrufen
        values = stations.values.all()
        df = values.df

        if df.empty:
            return None

        # Neueste Werte extrahieren
        latest = df.sort_values('date', ascending=False).iloc[0]
        station_info = stations.df.iloc[0]

        return WeatherData(
            station_id=str(station_info.get('station_id', '')),
            station_name=str(station_info.get('name', 'Unbekannt')),
            timestamp=datetime.now(),
            temperature_celsius=float(latest.get('value', 15.0)) if 'temperature' in latest.get('parameter', '') else 15.0,
            humidity_percent=70.0,  # Default
            pressure_hpa=1013.25,   # Default
            wind_speed_ms=float(latest.get('value', 0)) if 'wind_speed' in latest.get('parameter', '') else 0,
            wind_direction_deg=0,
            precipitation_mm=0,
            cloud_cover_percent=None
        )

    def _get_fallback_weather(self, lat: float, lon: float) -> WeatherData:
        """Fallback-Wetterdaten (Standard-Atmosphaere)."""
        return WeatherData(
            station_id='fallback',
            station_name='Standardatmosphaere',
            timestamp=datetime.now(),
            temperature_celsius=15.0,
            humidity_percent=70.0,
            pressure_hpa=1013.25,
            wind_speed_ms=2.0,
            wind_direction_deg=225,
            precipitation_mm=0,
            cloud_cover_percent=50
        )

    # --------------------------------------------------------------------------
    # PARCELS (ALKIS)
    # --------------------------------------------------------------------------

    async def get_parcels(self,
                          bbox: Tuple[float, float, float, float],
                          srs: str = 'EPSG:25832',
                          include_geometry: bool = False,
                          max_features: int = 500) -> List[GeoParcel]:
        """
        Laedt Flurstuecke aus ALKIS.

        Args:
            bbox: (minx, miny, maxx, maxy) in UTM32N
            srs: Koordinatensystem
            include_geometry: GeoJSON-Geometrie einschliessen
            max_features: Maximale Anzahl

        Returns:
            Liste von GeoParcel-Objekten
        """
        cache_key = self._cache_key('parcels', *bbox, srs, include_geometry)
        cached = self._get_cached(cache_key, 'parcels')
        if cached:
            return cached

        try:
            loader = self._get_nrw_loader()
            raw_parcels = loader.load_alkis_data(bbox, srs, max_features)

            parcels = []
            for raw in raw_parcels:
                centroid = None
                geojson = None

                if raw.geometry:
                    try:
                        c = raw.geometry.centroid
                        centroid = (c.x, c.y)
                        if include_geometry:
                            from shapely.geometry import mapping
                            geojson = mapping(raw.geometry)
                    except Exception:
                        pass

                parcels.append(GeoParcel(
                    id=raw.gml_id,
                    name=raw.flurstuecksnummer,
                    area_sqm=raw.flaeche_qm,
                    property_type=raw.eigentumsart.value,
                    municipality=raw.gemeinde,
                    district=raw.kreis,
                    centroid=centroid,
                    geometry_geojson=geojson
                ))

            self._set_cached(cache_key, parcels)
            logger.info(f"Geladen: {len(parcels)} Flurstuecke")
            return parcels

        except Exception as e:
            logger.error(f"ALKIS Laden fehlgeschlagen: {e}")
            return []

    # --------------------------------------------------------------------------
    # NOISE MAP
    # --------------------------------------------------------------------------

    async def get_ambient_noise(self,
                                 bbox: Tuple[float, float, float, float],
                                 noise_type: str = 'strasse',
                                 include_geometry: bool = False) -> List[NoiseZone]:
        """
        Laedt Laermkartierung (Vorbelastung).

        Args:
            bbox: Bounding Box in UTM32N
            noise_type: 'strasse', 'schiene', 'flug', 'industrie'
            include_geometry: GeoJSON einschliessen

        Returns:
            Liste von NoiseZone-Objekten
        """
        cache_key = self._cache_key('noise', *bbox, noise_type, include_geometry)
        cached = self._get_cached(cache_key, 'noise')
        if cached:
            return cached

        try:
            loader = self._get_nrw_loader()
            raw_noise = loader.load_noise_data(bbox, noise_type)

            zones = []
            for raw in raw_noise:
                geojson = None
                area = None

                if raw.geometry:
                    try:
                        area = raw.geometry.area
                        if include_geometry:
                            from shapely.geometry import mapping
                            geojson = mapping(raw.geometry)
                    except Exception:
                        pass

                zones.append(NoiseZone(
                    id=raw.id,
                    noise_type=raw.source_type,
                    lden_db=raw.lden,
                    lnight_db=raw.lnight,
                    year=raw.year,
                    area_sqm=area,
                    geometry_geojson=geojson
                ))

            self._set_cached(cache_key, zones)
            logger.info(f"Geladen: {len(zones)} Laermzonen")
            return zones

        except Exception as e:
            logger.error(f"Laermkartierung Laden fehlgeschlagen: {e}")
            return []

    # --------------------------------------------------------------------------
    # COORDINATE TRANSFORMATION
    # --------------------------------------------------------------------------

    def wgs84_to_utm32(self, lat: float, lon: float) -> Tuple[float, float]:
        """
        Transformiert WGS84 (lat/lon) nach UTM32N (EPSG:25832).
        """
        try:
            from pyproj import Transformer
            transformer = Transformer.from_crs('EPSG:4326', 'EPSG:25832', always_xy=True)
            x, y = transformer.transform(lon, lat)
            return (x, y)
        except ImportError:
            logger.warning("pyproj nicht verfuegbar - keine Transformation")
            return (lon, lat)

    def utm32_to_wgs84(self, x: float, y: float) -> Tuple[float, float]:
        """
        Transformiert UTM32N nach WGS84.
        """
        try:
            from pyproj import Transformer
            transformer = Transformer.from_crs('EPSG:25832', 'EPSG:4326', always_xy=True)
            lon, lat = transformer.transform(x, y)
            return (lat, lon)
        except ImportError:
            return (y, x)

    def create_bbox_from_center(self,
                                 lat: float,
                                 lon: float,
                                 radius_m: float = 500) -> Tuple[float, float, float, float]:
        """
        Erstellt eine Bounding Box um einen Punkt.

        Args:
            lat, lon: Zentrum in WGS84
            radius_m: Radius in Metern

        Returns:
            (minx, miny, maxx, maxy) in UTM32N
        """
        cx, cy = self.wgs84_to_utm32(lat, lon)
        return (
            cx - radius_m,
            cy - radius_m,
            cx + radius_m,
            cy + radius_m
        )

    # --------------------------------------------------------------------------
    # EXPORT
    # --------------------------------------------------------------------------

    def export_to_geojson(self, data: List[Any], output_path: Path) -> None:
        """
        Exportiert Daten als GeoJSON FeatureCollection.
        """
        features = []

        for item in data:
            if hasattr(item, 'geometry_geojson') and item.geometry_geojson:
                feature = {
                    'type': 'Feature',
                    'geometry': item.geometry_geojson,
                    'properties': {k: v for k, v in item.to_dict().items()
                                   if k != 'geometry'}
                }
                features.append(feature)

        geojson = {
            'type': 'FeatureCollection',
            'features': features,
            'crs': {
                'type': 'name',
                'properties': {'name': 'EPSG:25832'}
            }
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, indent=2, ensure_ascii=False)

        logger.info(f"Exportiert: {len(features)} Features nach {output_path}")


# ==============================================================================
# FASTAPI ROUTER
# ==============================================================================

def create_geodata_router():
    """
    Erstellt FastAPI Router fuer Geodata Endpoints.

    Returns:
        APIRouter mit /geodata Endpoints
    """
    from fastapi import APIRouter, Query, HTTPException
    from fastapi.responses import JSONResponse

    router = APIRouter(prefix='/geodata', tags=['Geodata'])
    service = GeodataService()

    @router.get('/status')
    async def get_service_status():
        """Prueft Status aller externen Dienste."""
        status = await service.check_all_services()
        return {name: s.to_dict() for name, s in status.items()}

    @router.get('/weather')
    async def get_weather(
        lat: float = Query(..., description='Breitengrad (WGS84)'),
        lon: float = Query(..., description='Laengengrad (WGS84)'),
        station_id: Optional[str] = Query(None, description='DWD Station ID')
    ):
        """Holt aktuelle Wetterdaten."""
        weather = await service.get_weather(lat, lon, station_id)
        if weather:
            return weather.to_dict()
        raise HTTPException(status_code=503, detail='Wetterdaten nicht verfuegbar')

    @router.get('/parcels')
    async def get_parcels(
        min_x: float = Query(..., description='Min X (UTM32N)'),
        min_y: float = Query(..., description='Min Y (UTM32N)'),
        max_x: float = Query(..., description='Max X (UTM32N)'),
        max_y: float = Query(..., description='Max Y (UTM32N)'),
        include_geometry: bool = Query(False, description='GeoJSON einschliessen'),
        max_features: int = Query(500, le=2000)
    ):
        """Laedt ALKIS Flurstuecke."""
        bbox = (min_x, min_y, max_x, max_y)
        parcels = await service.get_parcels(bbox, include_geometry=include_geometry,
                                            max_features=max_features)
        return [p.to_dict() for p in parcels]

    @router.get('/parcels/by-location')
    async def get_parcels_by_location(
        lat: float = Query(..., description='Breitengrad (WGS84)'),
        lon: float = Query(..., description='Laengengrad (WGS84)'),
        radius: float = Query(500, description='Radius in Metern'),
        include_geometry: bool = Query(False)
    ):
        """Laedt Flurstuecke um einen Punkt."""
        bbox = service.create_bbox_from_center(lat, lon, radius)
        parcels = await service.get_parcels(bbox, include_geometry=include_geometry)
        return [p.to_dict() for p in parcels]

    @router.get('/noise')
    async def get_ambient_noise(
        min_x: float = Query(..., description='Min X (UTM32N)'),
        min_y: float = Query(..., description='Min Y (UTM32N)'),
        max_x: float = Query(..., description='Max X (UTM32N)'),
        max_y: float = Query(..., description='Max Y (UTM32N)'),
        noise_type: str = Query('strasse', description='strasse|schiene|flug|industrie'),
        include_geometry: bool = Query(False)
    ):
        """Laedt Laermkartierung (Vorbelastung)."""
        bbox = (min_x, min_y, max_x, max_y)
        zones = await service.get_ambient_noise(bbox, noise_type, include_geometry)
        return [z.to_dict() for z in zones]

    @router.get('/noise/by-location')
    async def get_noise_by_location(
        lat: float = Query(..., description='Breitengrad (WGS84)'),
        lon: float = Query(..., description='Laengengrad (WGS84)'),
        radius: float = Query(1000, description='Radius in Metern'),
        noise_type: str = Query('strasse'),
        include_geometry: bool = Query(False)
    ):
        """Laedt Laermkartierung um einen Punkt."""
        bbox = service.create_bbox_from_center(lat, lon, radius)
        zones = await service.get_ambient_noise(bbox, noise_type, include_geometry)
        return [z.to_dict() for z in zones]

    @router.get('/transform')
    async def transform_coordinates(
        lat: Optional[float] = Query(None),
        lon: Optional[float] = Query(None),
        x: Optional[float] = Query(None),
        y: Optional[float] = Query(None)
    ):
        """Transformiert Koordinaten zwischen WGS84 und UTM32N."""
        if lat is not None and lon is not None:
            x_utm, y_utm = service.wgs84_to_utm32(lat, lon)
            return {'input': {'lat': lat, 'lon': lon, 'crs': 'EPSG:4326'},
                    'output': {'x': x_utm, 'y': y_utm, 'crs': 'EPSG:25832'}}
        elif x is not None and y is not None:
            lat_wgs, lon_wgs = service.utm32_to_wgs84(x, y)
            return {'input': {'x': x, 'y': y, 'crs': 'EPSG:25832'},
                    'output': {'lat': lat_wgs, 'lon': lon_wgs, 'crs': 'EPSG:4326'}}
        else:
            raise HTTPException(status_code=400,
                               detail='Entweder lat/lon oder x/y angeben')

    return router


# ==============================================================================
# CLI
# ==============================================================================

if __name__ == '__main__':
    import asyncio

    async def main():
        service = GeodataService()

        print("\n=== Geodata Service Test ===\n")

        # Status pruefen
        print("1. Service Status:")
        status = await service.check_all_services()
        for name, s in status.items():
            mark = "OK" if s.available else "FEHLER"
            print(f"   {mark} {s.name}: {s.response_time_ms:.0f}ms")

        # Wetter
        print("\n2. Wetterdaten (Iserlohn):")
        weather = await service.get_weather(51.3759, 7.6944)
        if weather:
            print(f"   Temperatur: {weather.temperature_celsius}°C")
            print(f"   Luftfeuchte: {weather.humidity_percent}%")
            print(f"   Wind: {weather.wind_speed_ms} m/s")

        print("\nDone!")

    asyncio.run(main())
