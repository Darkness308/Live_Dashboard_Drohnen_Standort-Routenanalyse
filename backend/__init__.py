"""
MORPHEUS Certified Core Backend
===============================

Gerichtsfestes Backend für TA-Lärm und ISO 9613-2 Berechnungen
basierend auf amtlichen Daten aus NRW Geoportal.

Modules:
    - integrations: WFS/WMS Daten-Import (ALKIS, Lärmkartierung, CityGML)
    - calculations: ISO 9613-2 Schallausbreitungsberechnung
    - models: Pydantic Datenmodelle für Validierung
    - api: FastAPI REST-Endpoints
    - utils: Hilfsfunktionen und Audit-Logging
"""

__version__ = "0.1.0"
__author__ = "MORPHEUS Project"
