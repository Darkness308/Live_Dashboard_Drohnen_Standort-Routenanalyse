"""
Data Integration Modules
========================

Anbindung an amtliche Geodaten-Dienste:
- ALKIS (Liegenschaftskataster)
- Lärmkartierung NRW
- CityGML LoD2 Gebäudemodelle
- DWD Wetterdaten
"""

from .nrw_data_loader import ALKISLoader, NoiseMapLoader, NRWDataLoader

__all__ = ["NRWDataLoader", "ALKISLoader", "NoiseMapLoader"]
