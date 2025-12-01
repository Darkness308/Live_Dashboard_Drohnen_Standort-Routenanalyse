"""
NRW Geoportal Data Loader
=========================

Lädt amtliche Geodaten aus den WFS-Diensten des Geoportal NRW:
- ALKIS Flurstücke (Eigentumsart)
- Lärmkartierung (Umgebungslärm Lden/Lnight)
- CityGML LoD2 Gebäudemodelle

Referenzen:
- Geoportal NRW: https://www.geoportal.nrw/
- ALKIS WFS: https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht
- Lärmkartierung: https://www.wfs.nrw.de/umwelt/laermkartierung
"""

import logging
import json
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from enum import Enum
from pathlib import Path

# Third-party imports (mit Fallback für fehlende Pakete)
try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    from owslib.wfs import WebFeatureService
    OWSLIB_AVAILABLE = True
except ImportError:
    OWSLIB_AVAILABLE = False

try:
    from shapely.geometry import shape
    SHAPELY_AVAILABLE = True
except ImportError:
    SHAPELY_AVAILABLE = False

# pyproj import removed (unused)


# Logger konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataSource(Enum):
    """Verfügbare Datenquellen im Geoportal NRW."""
    ALKIS = "alkis"
    LAERMKARTIERUNG = "laermkartierung"
    CITYGML = "citygml"
    DWD = "dwd"


class PropertyType(Enum):
    """Eigentumsarten nach ALKIS."""
    PRIVATE = "privat"
    PUBLIC = "oeffentlich"
    MIXED = "gemischt"
    UNKNOWN = "unbekannt"


@dataclass
class WFSEndpoint:
    """Konfiguration eines WFS-Endpoints."""
    name: str
    url: str
    version: str = "2.0.0"
    typename: str = ""
    srs: str = "EPSG:25832"  # UTM Zone 32N (Standard NRW)
    max_features: int = 1000
    timeout: int = 30


@dataclass
class ALKISFlurstueck:
    """Repräsentiert ein ALKIS Flurstück."""
    gml_id: str
    flurstuecksnummer: str
    gemarkung: str
    gemarkungsnummer: str
    gemeinde: str
    kreis: str
    flaeche_qm: float
    eigentumsart: PropertyType
    geometry: Optional[Any] = None  # Shapely Geometry
    raw_data: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Konvertiert zu Dictionary für JSON-Export."""
        return {
            "gml_id": self.gml_id,
            "flurstuecksnummer": self.flurstuecksnummer,
            "gemarkung": self.gemarkung,
            "gemarkungsnummer": self.gemarkungsnummer,
            "gemeinde": self.gemeinde,
            "kreis": self.kreis,
            "flaeche_qm": self.flaeche_qm,
            "eigentumsart": self.eigentumsart.value,
            "geometry_wkt": self.geometry.wkt if self.geometry else None
        }


@dataclass
class NoiseMeasurement:
    """Lärmkartierungs-Messpunkt nach EU-Umgebungslärmrichtlinie."""
    id: str
    lden: float  # Tag-Abend-Nacht Lärmindex dB(A)
    lnight: float  # Nacht-Lärmindex dB(A)
    source_type: str  # Straße, Schiene, Flugverkehr, Industrie
    year: int
    geometry: Optional[Any] = None
    grid_cell_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "lden": self.lden,
            "lnight": self.lnight,
            "source_type": self.source_type,
            "year": self.year,
            "geometry_wkt": self.geometry.wkt if self.geometry else None
        }


@dataclass
class AuditRecord:
    """Audit-Eintrag für gerichtsfeste Dokumentation."""
    timestamp: datetime
    data_source: DataSource
    endpoint_url: str
    query_parameters: Dict[str, Any]
    response_hash: str
    record_count: int
    processing_time_ms: int
    success: bool
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "data_source": self.data_source.value,
            "endpoint_url": self.endpoint_url,
            "query_parameters": self.query_parameters,
            "response_hash": self.response_hash,
            "record_count": self.record_count,
            "processing_time_ms": self.processing_time_ms,
            "success": self.success,
            "error_message": self.error_message
        }


class NRWDataLoader:
    """
    Hauptklasse für den Zugriff auf NRW Geoportal Dienste.

    Unterstützt:
    - ALKIS Flurstücke (Eigentumsart-Klassifikation)
    - Lärmkartierung (Vorbelastung)
    - CityGML LoD2 (Gebäudehöhen für Abschirmung)

    Beispiel:
        loader = NRWDataLoader()

        # Verfügbarkeit prüfen
        status = loader.check_service_availability()

        # ALKIS Daten laden
        flurstuecke = loader.load_alkis_data(
            bbox=(360000, 5660000, 370000, 5670000),
            srs="EPSG:25832"
        )
    """

    # WFS Endpoints für NRW Geoportal
    ENDPOINTS = {
        DataSource.ALKIS: WFSEndpoint(
            name="ALKIS Vereinfacht NRW",
            url="https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht",
            typename="ave:Flurstueck",
            version="2.0.0"
        ),
        DataSource.LAERMKARTIERUNG: WFSEndpoint(
            name="Lärmkartierung NRW",
            url="https://www.wfs.nrw.de/umwelt/laermkartierung",
            typename="ms:lden_strasse",  # Beispiel: Straßenlärm
            version="1.1.0"
        )
    }

    # Alternative Endpoints für Fallback
    FALLBACK_ENDPOINTS = {
        DataSource.ALKIS: WFSEndpoint(
            name="ALKIS Fallback",
            url="https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_aaa-modell-basiert",
            typename="ax:AX_Flurstueck",
            version="2.0.0"
        )
    }

    def __init__(self, cache_dir: Optional[Path] = None, audit_log_path: Optional[Path] = None):
        """
        Initialisiert den NRW Data Loader.

        Args:
            cache_dir: Verzeichnis für gecachte Daten
            audit_log_path: Pfad für Audit-Log (gerichtsfeste Dokumentation)
        """
        self.cache_dir = cache_dir or Path("./cache/nrw_data")
        self.audit_log_path = audit_log_path or Path("./logs/audit.jsonl")
        self.audit_records: List[AuditRecord] = []

        # Session mit Retry-Logik erstellen
        self.session = self._create_session()

        # Verfügbarkeit der Dependencies prüfen
        self._check_dependencies()

        # Cache-Verzeichnis erstellen
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.audit_log_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"NRWDataLoader initialisiert. Cache: {self.cache_dir}")

    def _check_dependencies(self):
        """Prüft die Verfügbarkeit benötigter Pakete."""
        missing = []

        if not REQUESTS_AVAILABLE:
            missing.append("requests")
        if not OWSLIB_AVAILABLE:
            missing.append("OWSLib")
        if not SHAPELY_AVAILABLE:
            missing.append("Shapely")
        if not PYPROJ_AVAILABLE:
            missing.append("pyproj")

        if missing:
            logger.warning(
                f"Fehlende Pakete: {', '.join(missing)}. "
                f"Installation: pip install {' '.join(missing)}"
            )
        else:
            logger.info("Alle Dependencies verfügbar.")

    def _create_session(self) -> Optional[Any]:
        """Erstellt eine requests Session mit Retry-Logik."""
        if not REQUESTS_AVAILABLE:
            return None

        session = requests.Session()

        # Retry-Strategie
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        # Standard Headers
        session.headers.update({
            "User-Agent": "MORPHEUS-DataLoader/0.1.0",
            "Accept": "application/json, application/gml+xml"
        })

        return session

    def check_service_availability(self) -> Dict[str, Dict[str, Any]]:
        """
        Prüft die Verfügbarkeit aller WFS-Dienste.

        Returns:
            Dictionary mit Status pro Dienst
        """
        results = {}

        for source, endpoint in self.ENDPOINTS.items():
            start_time = datetime.now()

            try:
                if not REQUESTS_AVAILABLE:
                    results[source.value] = {
                        "available": False,
                        "error": "requests library not installed"
                    }
                    continue

                # GetCapabilities Request
                params = {
                    "service": "WFS",
                    "version": endpoint.version,
                    "request": "GetCapabilities"
                }

                response = self.session.get(
                    endpoint.url,
                    params=params,
                    timeout=endpoint.timeout
                )

                elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000

                if response.status_code == 200:
                    # Parse Capabilities
                    available_layers = self._parse_capabilities(response.text)

                    results[source.value] = {
                        "available": True,
                        "url": endpoint.url,
                        "version": endpoint.version,
                        "response_time_ms": round(elapsed_ms, 2),
                        "layers_count": len(available_layers),
                        "sample_layers": available_layers[:5]
                    }

                    logger.info(f"✓ {endpoint.name}: {len(available_layers)} Layer verfügbar")
                else:
                    results[source.value] = {
                        "available": False,
                        "url": endpoint.url,
                        "status_code": response.status_code,
                        "error": f"HTTP {response.status_code}"
                    }
                    logger.warning(f"✗ {endpoint.name}: HTTP {response.status_code}")

            except Exception as e:
                results[source.value] = {
                    "available": False,
                    "url": endpoint.url,
                    "error": str(e)
                }
                logger.error(f"✗ {endpoint.name}: {e}")

        return results

    def _parse_capabilities(self, xml_content: str) -> List[str]:
        """Extrahiert Layer-Namen aus GetCapabilities Response."""
        layers = []

        # Einfaches Pattern-Matching für FeatureType Namen
        import re

        # WFS 2.0 Pattern
        pattern = r'<(?:wfs:)?Name>([^<]+)</(?:wfs:)?Name>'
        matches = re.findall(pattern, xml_content)

        # Filtere nur relevante Layer
        for match in matches:
            if match and not match.startswith('wfs:') and ':' in match:
                layers.append(match)

        return layers

    def load_alkis_data(
        self,
        bbox: tuple,
        srs: str = "EPSG:25832",
        max_features: int = 1000
    ) -> List[ALKISFlurstueck]:
        """
        Lädt ALKIS Flurstücksdaten für einen Bounding Box.

        Args:
            bbox: (minx, miny, maxx, maxy) in angegebenem SRS
            srs: Koordinatensystem (default: UTM32N)
            max_features: Maximale Anzahl Features

        Returns:
            Liste von ALKISFlurstueck Objekten
        """
        endpoint = self.ENDPOINTS[DataSource.ALKIS]
        start_time = datetime.now()

        logger.info(f"Lade ALKIS Daten für BBOX: {bbox}")

        try:
            if OWSLIB_AVAILABLE:
                return self._load_alkis_via_owslib(endpoint, bbox, srs, max_features)
            else:
                return self._load_alkis_via_requests(endpoint, bbox, srs, max_features)

        except Exception as e:
            logger.error(f"ALKIS Laden fehlgeschlagen: {e}")

            # Audit-Eintrag für Fehler
            self._log_audit(
                data_source=DataSource.ALKIS,
                endpoint_url=endpoint.url,
                query_parameters={"bbox": bbox, "srs": srs},
                response_hash="",
                record_count=0,
                processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                success=False,
                error_message=str(e)
            )

            return []

    def _load_alkis_via_owslib(
        self,
        endpoint: WFSEndpoint,
        bbox: tuple,
        srs: str,
        max_features: int
    ) -> List[ALKISFlurstueck]:
        """Lädt ALKIS via OWSLib."""
        wfs = WebFeatureService(url=endpoint.url, version=endpoint.version)

        response = wfs.getfeature(
            typename=[endpoint.typename],
            bbox=bbox,
            srsname=srs,
            maxfeatures=max_features,
            outputFormat='application/json'
        )

        data = json.loads(response.read())
        return self._parse_alkis_geojson(data)

    def _load_alkis_via_requests(
        self,
        endpoint: WFSEndpoint,
        bbox: tuple,
        srs: str,
        max_features: int
    ) -> List[ALKISFlurstueck]:
        """Lädt ALKIS via direktem HTTP Request."""
        if not REQUESTS_AVAILABLE:
            raise RuntimeError("requests library not available")

        # WFS GetFeature Request
        params = {
            "service": "WFS",
            "version": endpoint.version,
            "request": "GetFeature",
            "typename": endpoint.typename,
            "srsname": srs,
            "bbox": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]},{srs}",
            "maxFeatures": max_features,
            "outputFormat": "application/json"
        }

        response = self.session.get(
            endpoint.url,
            params=params,
            timeout=endpoint.timeout
        )

        if response.status_code != 200:
            raise RuntimeError(f"WFS Request failed: HTTP {response.status_code}")

        data = response.json()
        return self._parse_alkis_geojson(data)

    def _parse_alkis_geojson(self, geojson: Dict) -> List[ALKISFlurstueck]:
        """Parst GeoJSON zu ALKISFlurstueck Objekten."""
        flurstuecke = []

        features = geojson.get('features', [])

        for feature in features:
            props = feature.get('properties', {})
            geom = feature.get('geometry')

            # Eigentumsart bestimmen
            eigentumsart = self._classify_property_type(props)

            # Geometrie parsen
            geometry = None
            if SHAPELY_AVAILABLE and geom:
                try:
                    geometry = shape(geom)
                except Exception as exc:
                    # GeoJSON Geometrie kann fehlerhaft sein; Fehler protokollieren und Flurstück ohne Geometrie weiterverarbeiten
                    logger.warning(f"Fehler beim Parsen der Geometrie für Flurstück (ID: {props.get('gml_id', feature.get('id', ''))}): {exc}")

            flurstueck = ALKISFlurstueck(
                gml_id=props.get('gml_id', feature.get('id', '')),
                flurstuecksnummer=props.get('flurstueckskennzeichen', ''),
                gemarkung=props.get('gemarkung', ''),
                gemarkungsnummer=props.get('gemarkungsnummer', ''),
                gemeinde=props.get('gemeinde', ''),
                kreis=props.get('kreis', ''),
                flaeche_qm=float(props.get('flaeche', 0)),
                eigentumsart=eigentumsart,
                geometry=geometry,
                raw_data=props
            )

            flurstuecke.append(flurstueck)

        logger.info(f"Parsed {len(flurstuecke)} Flurstücke")
        return flurstuecke

    def _classify_property_type(self, properties: Dict) -> PropertyType:
        """
        Klassifiziert die Eigentumsart basierend auf ALKIS-Attributen.

        Heuristik:
        - Öffentlich: Straßen, Wege, Gewässer, öffentliche Gebäude
        - Privat: Wohnbauflächen, Gewerbeflächen
        """
        nutzung = properties.get('tatsaechlichenutzung', '').lower()
        art = properties.get('art', '').lower()

        public_keywords = [
            'strasse', 'weg', 'platz', 'gewaesser', 'bach', 'fluss',
            'oeffentlich', 'gemeinde', 'stadt', 'land', 'bund',
            'schule', 'kirche', 'friedhof', 'park', 'gruen'
        ]

        private_keywords = [
            'wohn', 'gewerbe', 'industrie', 'landwirtschaft',
            'garten', 'privat'
        ]

        combined = f"{nutzung} {art}"

        if any(kw in combined for kw in public_keywords):
            return PropertyType.PUBLIC
        elif any(kw in combined for kw in private_keywords):
            return PropertyType.PRIVATE
        else:
            return PropertyType.UNKNOWN

    def load_noise_data(
        self,
        bbox: tuple,
        noise_type: str = "strasse",
        srs: str = "EPSG:25832"
    ) -> List[NoiseMeasurement]:
        """
        Lädt Lärmkartierungsdaten für einen Bereich.

        Args:
            bbox: Bounding Box
            noise_type: Art des Lärms (strasse, schiene, flug, industrie)
            srs: Koordinatensystem

        Returns:
            Liste von NoiseMeasurement Objekten
        """
        endpoint = self.ENDPOINTS[DataSource.LAERMKARTIERUNG]

        # Typename basierend auf Lärmtyp
        typename_map = {
            "strasse": "ms:lden_strasse",
            "schiene": "ms:lden_schiene",
            "flug": "ms:lden_flugverkehr",
            "industrie": "ms:lden_industrie"
        }

        typename = typename_map.get(noise_type, typename_map["strasse"])

        logger.info(f"Lade Lärmkartierung ({noise_type}) für BBOX: {bbox}")

        try:
            if not REQUESTS_AVAILABLE:
                raise RuntimeError("requests library not available")

            params = {
                "service": "WFS",
                "version": endpoint.version,
                "request": "GetFeature",
                "typename": typename,
                "srsname": srs,
                "bbox": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]},{srs}",
                "outputFormat": "application/json"
            }

            response = self.session.get(
                endpoint.url,
                params=params,
                timeout=endpoint.timeout
            )

            if response.status_code == 200:
                data = response.json()
                return self._parse_noise_geojson(data, noise_type)
            else:
                logger.warning(f"Lärmkartierung Request failed: HTTP {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"Lärmkartierung Laden fehlgeschlagen: {e}")
            return []

    def _parse_noise_geojson(self, geojson: Dict, source_type: str) -> List[NoiseMeasurement]:
        """Parst Lärmkartierungs-GeoJSON."""
        measurements = []

        features = geojson.get('features', [])

        for feature in features:
            props = feature.get('properties', {})
            geom = feature.get('geometry')

            geometry = None
            if SHAPELY_AVAILABLE and geom:
                try:
                    geometry = shape(geom)
                except Exception as e:
                    # Fehler beim Parsen der Geometrie wird unterdrückt, da Geometrie optional ist.
                    logger.debug(f"Fehler beim Parsen der Geometrie: {e}")

            measurement = NoiseMeasurement(
                id=props.get('gml_id', feature.get('id', '')),
                lden=float(props.get('lden', props.get('db_lden', 0))),
                lnight=float(props.get('lnight', props.get('db_lnight', 0))),
                source_type=source_type,
                year=int(props.get('jahr', props.get('year', 2022))),
                geometry=geometry,
                grid_cell_id=props.get('grid_id')
            )

            measurements.append(measurement)

        logger.info(f"Parsed {len(measurements)} Lärm-Messpunkte")
        return measurements

    def _log_audit(
        self,
        data_source: DataSource,
        endpoint_url: str,
        query_parameters: Dict,
        response_hash: str,
        record_count: int,
        processing_time_ms: int,
        success: bool,
        error_message: Optional[str] = None
    ):
        """Schreibt einen Audit-Eintrag für gerichtsfeste Dokumentation."""
        record = AuditRecord(
            timestamp=datetime.now(),
            data_source=data_source,
            endpoint_url=endpoint_url,
            query_parameters=query_parameters,
            response_hash=response_hash,
            record_count=record_count,
            processing_time_ms=processing_time_ms,
            success=success,
            error_message=error_message
        )

        self.audit_records.append(record)

        # In Datei schreiben
        try:
            with open(self.audit_log_path, 'a') as f:
                f.write(json.dumps(record.to_dict()) + '\n')
        except Exception as e:
            logger.error(f"Audit-Log Schreiben fehlgeschlagen: {e}")

    def get_audit_trail(self) -> List[Dict]:
        """Gibt alle Audit-Einträge zurück."""
        return [r.to_dict() for r in self.audit_records]


class ALKISLoader(NRWDataLoader):
    """Spezialisierter Loader nur für ALKIS Daten."""

    def load(self, bbox: tuple, **kwargs) -> List[ALKISFlurstueck]:
        return self.load_alkis_data(bbox, **kwargs)


class NoiseMapLoader(NRWDataLoader):
    """Spezialisierter Loader nur für Lärmkartierung."""

    def load(self, bbox: tuple, noise_type: str = "strasse", **kwargs) -> List[NoiseMeasurement]:
        return self.load_noise_data(bbox, noise_type, **kwargs)


# ============================================================================
# CLI Interface
# ============================================================================

def main():
    """CLI Hauptfunktion zum Testen der WFS-Verbindungen."""
    import argparse

    parser = argparse.ArgumentParser(
        description="NRW Geoportal Data Loader - Prüft WFS-Dienste"
    )
    parser.add_argument(
        '--check',
        action='store_true',
        help='Prüft die Verfügbarkeit aller WFS-Dienste'
    )
    parser.add_argument(
        '--bbox',
        type=str,
        help='Bounding Box für Datenabfrage (minx,miny,maxx,maxy)'
    )
    parser.add_argument(
        '--type',
        choices=['alkis', 'noise'],
        default='alkis',
        help='Datentyp zum Laden'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Output-Datei für Ergebnisse (JSON)'
    )

    args = parser.parse_args()

    loader = NRWDataLoader()

    if args.check:
        print("\n=== NRW Geoportal WFS Dienste Status ===\n")
        status = loader.check_service_availability()

        for service, info in status.items():
            if info.get('available'):
                print(f"✓ {service.upper()}")
                print(f"  URL: {info['url']}")
                print(f"  Response Time: {info['response_time_ms']}ms")
                print(f"  Layers: {info['layers_count']}")
                if info.get('sample_layers'):
                    print(f"  Sample Layers: {', '.join(info['sample_layers'][:3])}")
            else:
                print(f"✗ {service.upper()}")
                print(f"  Error: {info.get('error', 'Unknown')}")
            print()

    elif args.bbox:
        bbox = tuple(map(float, args.bbox.split(',')))

        if args.type == 'alkis':
            data = loader.load_alkis_data(bbox)
            print(f"\nGeladene Flurstücke: {len(data)}")

            if args.output:
                with open(args.output, 'w') as f:
                    json.dump([d.to_dict() for d in data], f, indent=2)
                print(f"Gespeichert in: {args.output}")

        elif args.type == 'noise':
            data = loader.load_noise_data(bbox)
            print(f"\nGeladene Lärm-Messpunkte: {len(data)}")

            if args.output:
                with open(args.output, 'w') as f:
                    json.dump([d.to_dict() for d in data], f, indent=2)
                print(f"Gespeichert in: {args.output}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
