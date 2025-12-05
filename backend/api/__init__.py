"""
MORPHEUS Backend API
====================

FastAPI-basierte REST-API für:
- ISO 9613-2 Schallausbreitungsberechnung
- NRW Geoportal WFS Integration
- TA Lärm Compliance-Prüfung
- Audit-Trail Management
"""

from .main import app

__all__ = ["app"]
