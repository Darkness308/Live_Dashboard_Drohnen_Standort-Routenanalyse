"""
ISO 9613-2 Sound Propagation Calculator - Optimized Version
=============================================================

NumPy/Numba-optimierte Implementierung der ISO 9613-2 Berechnung.
Bietet bis zu 100x schnellere Berechnungen fuer grosse Raster.

Features:
- Vektorisierte NumPy-Berechnungen fuer Batch-Processing
- Numba JIT-Kompilierung fuer kritische Pfade
- Parallele Berechnung mit numba.prange
- Kompatibilitaet mit Original-API

Referenzen:
- ISO 9613-2:1996
- TA Laerm 1998

Beispiel:
    from iso9613_optimized import FastISO9613Calculator

    calc = FastISO9613Calculator()

    # Einzelne Berechnung (API-kompatibel)
    result = calc.calculate(source, receiver)

    # Batch-Berechnung (10-100x schneller)
    results = calc.calculate_grid_fast(
        source_pos=(0, 0, 50),
        source_lw=75.0,
        bbox=(-500, -500, 500, 500),
        grid_size=10
    )
"""

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

# Numba fuer JIT-Kompilierung (optional, graceful fallback)
try:
    from numba import jit, prange

    NUMBA_AVAILABLE = True
except ImportError:
    NUMBA_AVAILABLE = False

    # Fallback-Decorator wenn Numba nicht verfuegbar
    def jit(*args, **kwargs):
        def decorator(func):
            return func

        return decorator

    prange = range

from .iso9613 import (
    AttenuationResult,
    GroundType,
    NoiseSource,
    Obstacle,
    Receiver,
    WeatherConditions,
)

logger = logging.getLogger(__name__)


# ==============================================================================
# NUMBA-OPTIMIERTE KERNFUNKTIONEN
# ==============================================================================


@jit(nopython=True, cache=True, fastmath=True)
def _distance_3d(
    x1: float, y1: float, z1: float, x2: float, y2: float, z2: float
) -> float:
    """Berechnet 3D-Distanz (JIT-kompiliert)."""
    dx = x2 - x1
    dy = y2 - y1
    dz = z2 - z1
    return math.sqrt(dx * dx + dy * dy + dz * dz)


@jit(nopython=True, cache=True, fastmath=True)
def _geometric_divergence_jit(distance: float) -> float:
    """
    Geometrische Ausbreitung Adiv (JIT-kompiliert).
    Formel: Adiv = 20 * log10(d) + 11 dB
    """
    d = max(distance, 1.0)
    return 20.0 * math.log10(d) + 11.0


@jit(nopython=True, cache=True, fastmath=True)
def _atmospheric_absorption_jit(distance: float, alpha_a: float = 2.0) -> float:
    """
    Atmosphaerische Absorption Aatm (JIT-kompiliert).
    Formel: Aatm = alpha * d / 1000
    """
    return alpha_a * (distance / 1000.0)


@jit(nopython=True, cache=True, fastmath=True)
def _ground_effect_jit(
    source_z: float, receiver_z: float, distance: float, ground_factor: float = 0.5
) -> float:
    """
    Bodeneffekt Agr (JIT-kompiliert).
    Vereinfachte Methode nach ISO 9613-2 Abschnitt 7.3.1.
    """
    hs = source_z
    hr = receiver_z

    diff_sq = distance * distance - (hs - hr) * (hs - hr)
    if diff_sq < 0:
        return 0.0

    dp = math.sqrt(diff_sq)
    if dp < 1.0:
        return 0.0

    hm = (hs + hr) / 2.0
    a_gr = 4.8 - (2.0 * hm / dp) * (17.0 + 300.0 / dp)
    a_gr = max(0.0, min(a_gr, 10.0)) * ground_factor

    return a_gr


@jit(nopython=True, cache=True, fastmath=True)
def _calculate_spl_single(
    source_x: float,
    source_y: float,
    source_z: float,
    source_lw: float,
    source_dc: float,
    receiver_x: float,
    receiver_y: float,
    receiver_z: float,
    ground_factor: float = 0.5,
    alpha_a: float = 2.0,
) -> Tuple[float, float]:
    """
    Berechnet SPL fuer einen einzelnen Punkt (JIT-kompiliert).

    Returns:
        (sound_pressure_level, total_attenuation)
    """
    # Distanz
    d = _distance_3d(source_x, source_y, source_z, receiver_x, receiver_y, receiver_z)

    # Daempfungskomponenten
    a_div = _geometric_divergence_jit(d)
    a_atm = _atmospheric_absorption_jit(d, alpha_a)
    a_gr = _ground_effect_jit(source_z, receiver_z, d, ground_factor)
    a_bar = 0.0  # Abschirmung separat
    a_misc = 0.0

    total_a = a_div + a_atm + a_gr + a_bar + a_misc

    # LAT = LW + Dc - A
    spl = source_lw + source_dc - total_a

    return spl, total_a


@jit(nopython=True, parallel=True, cache=True, fastmath=True)
def _calculate_grid_parallel(
    source_x: float,
    source_y: float,
    source_z: float,
    source_lw: float,
    source_dc: float,
    grid_x: np.ndarray,
    grid_y: np.ndarray,
    receiver_z: float,
    ground_factor: float = 0.5,
    alpha_a: float = 2.0,
) -> np.ndarray:
    """
    Berechnet SPL fuer ein gesamtes Raster parallel (JIT + parallel).

    Args:
        source_x, source_y, source_z: Quellposition
        source_lw: Schallleistungspegel
        source_dc: Richtcharakteristik
        grid_x, grid_y: 1D-Arrays mit X- und Y-Koordinaten
        receiver_z: Empfaengerhoehe
        ground_factor: Bodenfaktor (0=hart, 1=weich)
        alpha_a: Atmosphaerischer Absorptionskoeffizient

    Returns:
        2D-Array mit SPL-Werten [len(grid_y), len(grid_x)]
    """
    nx = len(grid_x)
    ny = len(grid_y)
    result = np.zeros((ny, nx), dtype=np.float64)

    for i in prange(ny):
        for j in range(nx):
            rx = grid_x[j]
            ry = grid_y[i]

            spl, _ = _calculate_spl_single(
                source_x,
                source_y,
                source_z,
                source_lw,
                source_dc,
                rx,
                ry,
                receiver_z,
                ground_factor,
                alpha_a,
            )
            result[i, j] = spl

    return result


@jit(nopython=True, parallel=True, cache=True, fastmath=True)
def _calculate_batch_receivers(
    source_x: float,
    source_y: float,
    source_z: float,
    source_lw: float,
    source_dc: float,
    receivers: np.ndarray,
    ground_factor: float = 0.5,
    alpha_a: float = 2.0,
) -> np.ndarray:
    """
    Berechnet SPL fuer eine Liste von Empfaengern parallel.

    Args:
        receivers: 2D-Array mit Shape (n, 3) fuer [x, y, z] Koordinaten

    Returns:
        1D-Array mit SPL-Werten
    """
    n = len(receivers)
    result = np.zeros(n, dtype=np.float64)

    for i in prange(n):
        rx = receivers[i, 0]
        ry = receivers[i, 1]
        rz = receivers[i, 2]

        spl, _ = _calculate_spl_single(
            source_x,
            source_y,
            source_z,
            source_lw,
            source_dc,
            rx,
            ry,
            rz,
            ground_factor,
            alpha_a,
        )
        result[i] = spl

    return result


@jit(nopython=True, parallel=True, cache=True, fastmath=True)
def _calculate_route_noise(
    source_lw: float,
    source_dc: float,
    route_points: np.ndarray,
    receiver_x: float,
    receiver_y: float,
    receiver_z: float,
    ground_factor: float = 0.5,
    alpha_a: float = 2.0,
) -> Tuple[float, float, np.ndarray]:
    """
    Berechnet den aequivalenten Dauerschallpegel fuer eine Flugroute.

    Energetische Mittelung ueber alle Routenpunkte.

    Args:
        route_points: 2D-Array mit Shape (n, 3) fuer [x, y, z] Positionen

    Returns:
        (leq, max_spl, spl_array)
    """
    n = len(route_points)
    spl_values = np.zeros(n, dtype=np.float64)

    for i in prange(n):
        sx = route_points[i, 0]
        sy = route_points[i, 1]
        sz = route_points[i, 2]

        spl, _ = _calculate_spl_single(
            sx,
            sy,
            sz,
            source_lw,
            source_dc,
            receiver_x,
            receiver_y,
            receiver_z,
            ground_factor,
            alpha_a,
        )
        spl_values[i] = spl

    # Energetische Mittelung: Leq = 10 * log10(mean(10^(Li/10)))
    energy_sum = 0.0
    for i in range(n):
        energy_sum += 10.0 ** (spl_values[i] / 10.0)

    leq = 10.0 * math.log10(energy_sum / n)
    max_spl = np.max(spl_values)

    return leq, max_spl, spl_values


# ==============================================================================
# NUMPY-VEKTORISIERTE FUNKTIONEN (fuer kleinere Datensaetze)
# ==============================================================================


def _calculate_grid_vectorized(
    source_pos: Tuple[float, float, float],
    source_lw: float,
    xx: np.ndarray,
    yy: np.ndarray,
    receiver_z: float,
    ground_factor: float = 0.5,
    alpha_a: float = 2.0,
) -> np.ndarray:
    """
    Vektorisierte NumPy-Berechnung (ohne Numba).
    Schneller als Python-Loop, aber langsamer als Numba.
    """
    sx, sy, sz = source_pos

    # 3D-Distanz
    dx = xx - sx
    dy = yy - sy
    dz = receiver_z - sz
    distance = np.sqrt(dx**2 + dy**2 + dz**2)

    # Minimum Distanz
    distance = np.maximum(distance, 1.0)

    # Daempfungskomponenten
    a_div = 20.0 * np.log10(distance) + 11.0
    a_atm = alpha_a * (distance / 1000.0)

    # Bodeneffekt (vereinfacht)
    diff_sq = distance**2 - (sz - receiver_z) ** 2
    diff_sq = np.maximum(diff_sq, 0.0)
    dp = np.sqrt(diff_sq)
    dp = np.maximum(dp, 1.0)
    hm = (sz + receiver_z) / 2.0
    a_gr = 4.8 - (2.0 * hm / dp) * (17.0 + 300.0 / dp)
    a_gr = np.clip(a_gr, 0.0, 10.0) * ground_factor

    total_a = a_div + a_atm + a_gr
    spl = source_lw - total_a

    return spl


# ==============================================================================
# HAUPTKLASSE
# ==============================================================================


class FastISO9613Calculator:
    """
    Optimierter ISO 9613-2 Calculator mit NumPy/Numba.

    Beispiel:
        calc = FastISO9613Calculator()

        # Schnelle Rasterberechnung
        grid = calc.calculate_grid_fast(
            source_pos=(0, 0, 50),
            source_lw=75.0,
            bbox=(-500, -500, 500, 500),
            grid_size=10
        )

        # Routenberechnung
        route_result = calc.calculate_route(
            source_lw=75.0,
            route_points=np.array([[0,0,50], [100,0,60], [200,0,50]]),
            receiver_pos=(150, 50, 4)
        )
    """

    def __init__(self, weather: Optional[WeatherConditions] = None):
        self.weather = weather or WeatherConditions()
        self._alpha_a = 2.0  # A-bewerteter Absorptionskoeffizient

        if NUMBA_AVAILABLE:
            logger.info("FastISO9613Calculator mit Numba JIT initialisiert")
            # Warmup JIT-Kompilierung
            self._warmup_jit()
        else:
            logger.warning("Numba nicht verfuegbar - verwende NumPy Fallback")

    def _warmup_jit(self):
        """Waermt den JIT-Compiler auf (erste Ausfuehrung ist langsam)."""
        try:
            _ = _calculate_spl_single(0, 0, 50, 75, 0, 100, 0, 4, 0.5, 2.0)
            logger.debug("JIT-Warmup abgeschlossen")
        except Exception as e:
            logger.warning(f"JIT-Warmup fehlgeschlagen: {e}")

    # --------------------------------------------------------------------------
    # API-KOMPATIBLE METHODEN (wie Original)
    # --------------------------------------------------------------------------

    def calculate(
        self,
        source: NoiseSource,
        receiver: Receiver,
        obstacles: Optional[List[Obstacle]] = None,
        octave_bands: bool = False,
    ) -> AttenuationResult:
        """
        API-kompatible Berechnung (wie Original ISO9613Calculator).
        """
        ground_factor = {
            GroundType.HARD: 0.0,
            GroundType.SOFT: 1.0,
            GroundType.MIXED: 0.5,
        }.get(receiver.ground_type, 0.5)

        spl, total_a = _calculate_spl_single(
            source.x,
            source.y,
            source.z,
            source.lw,
            source.directivity,
            receiver.x,
            receiver.y,
            receiver.z,
            ground_factor,
            self._alpha_a,
        )

        # Distanz fuer Ergebnis
        d = _distance_3d(
            source.x, source.y, source.z, receiver.x, receiver.y, receiver.z
        )

        # Einzelne Komponenten (approximiert fuer Kompatibilitaet)
        a_div = _geometric_divergence_jit(d)
        a_atm = _atmospheric_absorption_jit(d, self._alpha_a)
        a_gr = total_a - a_div - a_atm  # Rest

        return AttenuationResult(
            source_lw=source.lw,
            distance_m=d,
            a_div=a_div,
            a_atm=a_atm,
            a_gr=a_gr,
            a_bar=0.0,
            a_misc=0.0,
            total_attenuation=total_a,
            sound_pressure_level=spl,
            calculation_method="ISO 9613-2:1996 (NumPy/Numba optimized)",
        )

    def calculate_grid(
        self,
        source: NoiseSource,
        bbox: Tuple[float, float, float, float],
        grid_size: float = 10.0,
        receiver_height: float = 4.0,
    ) -> List[Dict]:
        """
        API-kompatible Rasterberechnung (Rueckgabeformat wie Original).
        Intern wird calculate_grid_fast verwendet.
        """
        result = self.calculate_grid_fast(
            source_pos=(source.x, source.y, source.z),
            source_lw=source.lw,
            bbox=bbox,
            grid_size=grid_size,
            receiver_height=receiver_height,
            source_dc=source.directivity,
        )

        # In Listen-Format umwandeln (API-Kompatibilitaet)
        output = []
        for row in result["grid_data"]:
            output.append(
                {
                    "x": row["x"],
                    "y": row["y"],
                    "z": receiver_height,
                    "spl_dba": row["spl"],
                    "distance_m": round(
                        _distance_3d(
                            source.x,
                            source.y,
                            source.z,
                            row["x"],
                            row["y"],
                            receiver_height,
                        ),
                        1,
                    ),
                }
            )

        return output

    # --------------------------------------------------------------------------
    # OPTIMIERTE METHODEN
    # --------------------------------------------------------------------------

    def calculate_grid_fast(
        self,
        source_pos: Tuple[float, float, float],
        source_lw: float,
        bbox: Tuple[float, float, float, float],
        grid_size: float = 10.0,
        receiver_height: float = 4.0,
        source_dc: float = 0.0,
        ground_factor: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Schnelle Rasterberechnung mit NumPy/Numba.

        Args:
            source_pos: (x, y, z) der Schallquelle
            source_lw: Schallleistungspegel in dB(A)
            bbox: (minx, miny, maxx, maxy) Begrenzungsbox
            grid_size: Rastergroesse in Metern
            receiver_height: Empfaengerhoehe ueber Grund
            source_dc: Richtcharakteristik
            ground_factor: Bodenfaktor (0=hart, 0.5=gemischt, 1=weich)

        Returns:
            Dict mit:
                - spl_matrix: 2D-NumPy-Array mit SPL-Werten
                - grid_x, grid_y: 1D-Arrays mit Koordinaten
                - grid_data: Liste von Dicts fuer GeoJSON-Export
                - stats: Statistiken (min, max, mean)
        """
        minx, miny, maxx, maxy = bbox
        sx, sy, sz = source_pos

        # Raster erstellen
        grid_x = np.arange(minx, maxx + grid_size, grid_size)
        grid_y = np.arange(miny, maxy + grid_size, grid_size)

        logger.info(
            f"Berechne Raster: {len(grid_x)}x{len(grid_y)} = "
            f"{len(grid_x) * len(grid_y)} Punkte"
        )

        # Berechnung
        if NUMBA_AVAILABLE:
            spl_matrix = _calculate_grid_parallel(
                sx,
                sy,
                sz,
                source_lw,
                source_dc,
                grid_x,
                grid_y,
                receiver_height,
                ground_factor,
                self._alpha_a,
            )
        else:
            # NumPy Fallback
            xx, yy = np.meshgrid(grid_x, grid_y)
            spl_matrix = _calculate_grid_vectorized(
                source_pos,
                source_lw,
                xx,
                yy,
                receiver_height,
                ground_factor,
                self._alpha_a,
            )

        # Grid-Daten fuer Export
        grid_data = []
        for i, y in enumerate(grid_y):
            for j, x in enumerate(grid_x):
                grid_data.append(
                    {
                        "x": float(x),
                        "y": float(y),
                        "spl": round(float(spl_matrix[i, j]), 1),
                    }
                )

        return {
            "spl_matrix": spl_matrix,
            "grid_x": grid_x,
            "grid_y": grid_y,
            "grid_data": grid_data,
            "stats": {
                "min_spl": round(float(np.min(spl_matrix)), 1),
                "max_spl": round(float(np.max(spl_matrix)), 1),
                "mean_spl": round(float(np.mean(spl_matrix)), 1),
                "grid_points": len(grid_x) * len(grid_y),
            },
        }

    def calculate_batch(
        self,
        source_pos: Tuple[float, float, float],
        source_lw: float,
        receivers: np.ndarray,
        source_dc: float = 0.0,
        ground_factor: float = 0.5,
    ) -> np.ndarray:
        """
        Berechnet SPL fuer mehrere Empfaenger gleichzeitig.

        Args:
            source_pos: (x, y, z) der Schallquelle
            source_lw: Schallleistungspegel in dB(A)
            receivers: NumPy-Array mit Shape (n, 3) fuer [x, y, z]
            source_dc: Richtcharakteristik
            ground_factor: Bodenfaktor

        Returns:
            1D-NumPy-Array mit SPL-Werten
        """
        sx, sy, sz = source_pos
        receivers = np.asarray(receivers, dtype=np.float64)

        if NUMBA_AVAILABLE:
            return _calculate_batch_receivers(
                sx,
                sy,
                sz,
                source_lw,
                source_dc,
                receivers,
                ground_factor,
                self._alpha_a,
            )
        else:
            # NumPy Fallback
            results = np.zeros(len(receivers))
            for i, (rx, ry, rz) in enumerate(receivers):
                d = _distance_3d(sx, sy, sz, rx, ry, rz)
                a_div = 20.0 * np.log10(max(d, 1.0)) + 11.0
                a_atm = self._alpha_a * (d / 1000.0)
                results[i] = source_lw + source_dc - a_div - a_atm
            return results

    def calculate_route(
        self,
        source_lw: float,
        route_points: np.ndarray,
        receiver_pos: Tuple[float, float, float],
        source_dc: float = 0.0,
        ground_factor: float = 0.5,
    ) -> Dict[str, Any]:
        """
        Berechnet den aequivalenten Dauerschallpegel Leq fuer eine Flugroute.

        Args:
            source_lw: Schallleistungspegel der Drohne
            route_points: NumPy-Array mit Shape (n, 3) fuer [x, y, z]
            receiver_pos: (x, y, z) des Empfaengers
            source_dc: Richtcharakteristik
            ground_factor: Bodenfaktor

        Returns:
            Dict mit Leq, Lmax, und SPL-Verlauf
        """
        route_points = np.asarray(route_points, dtype=np.float64)
        rx, ry, rz = receiver_pos

        if NUMBA_AVAILABLE:
            leq, max_spl, spl_values = _calculate_route_noise(
                source_lw,
                source_dc,
                route_points,
                rx,
                ry,
                rz,
                ground_factor,
                self._alpha_a,
            )
        else:
            # NumPy Fallback
            n = len(route_points)
            spl_values = np.zeros(n)

            for i, (sx, sy, sz) in enumerate(route_points):
                d = _distance_3d(sx, sy, sz, rx, ry, rz)
                a_div = 20.0 * np.log10(max(d, 1.0)) + 11.0
                a_atm = self._alpha_a * (d / 1000.0)
                spl_values[i] = source_lw + source_dc - a_div - a_atm

            energy_sum = np.sum(10.0 ** (spl_values / 10.0))
            leq = 10.0 * np.log10(energy_sum / n)
            max_spl = np.max(spl_values)

        return {
            "leq": round(float(leq), 1),
            "lmax": round(float(max_spl), 1),
            "spl_profile": spl_values.tolist(),
            "route_points": len(route_points),
            "method": "ISO 9613-2:1996 (energetic average)",
        }

    def calculate_isophone_contours(
        self,
        source_pos: Tuple[float, float, float],
        source_lw: float,
        levels: List[float] = None,
        max_distance: float = 1000,
        resolution: float = 10,
    ) -> Dict[str, Any]:
        """
        Berechnet Isophonen-Konturen (Linien gleichen Schallpegels).

        Args:
            source_pos: (x, y, z) der Schallquelle
            source_lw: Schallleistungspegel
            levels: Liste von dB-Werten fuer Konturen (default: [35,40,45,50,55,60])
            max_distance: Maximale Entfernung vom Zentrum
            resolution: Rasteraufloesung

        Returns:
            Dict mit Konturdaten fuer jedes Level (geeignet fuer GeoJSON)
        """
        if levels is None:
            levels = [35, 40, 45, 50, 55, 60]

        sx, sy, _ = source_pos

        # Raster berechnen
        result = self.calculate_grid_fast(
            source_pos=source_pos,
            source_lw=source_lw,
            bbox=(
                sx - max_distance,
                sy - max_distance,
                sx + max_distance,
                sy + max_distance,
            ),
            grid_size=resolution,
        )

        spl_matrix = result["spl_matrix"]
        grid_x = result["grid_x"]
        grid_y = result["grid_y"]

        contours = {}

        try:
            import matplotlib.pyplot as plt

            # Matplotlib fuer Konturextraktion verwenden
            fig, ax = plt.subplots()
            cs = ax.contour(grid_x, grid_y, spl_matrix, levels=levels)
            plt.close(fig)

            for i, level in enumerate(levels):
                paths = []
                for collection in cs.collections[i].get_paths():
                    vertices = collection.vertices
                    paths.append(vertices.tolist())

                contours[f"{int(level)}_db"] = {
                    "level": level,
                    "paths": paths,
                    "color": self._get_noise_color(level),
                }

        except ImportError:
            # Fallback ohne matplotlib: einfache Threshold-Berechnung
            for level in levels:
                mask = (spl_matrix >= level - 2.5) & (spl_matrix < level + 2.5)
                points = []
                for i, y in enumerate(grid_y):
                    for j, x in enumerate(grid_x):
                        if mask[i, j]:
                            points.append([float(x), float(y)])

                contours[f"{int(level)}_db"] = {
                    "level": level,
                    "points": points,
                    "color": self._get_noise_color(level),
                }

        return contours

    def _get_noise_color(self, db: float) -> str:
        """Gibt Hex-Farbcode fuer Laermpegel zurueck."""
        if db < 40:
            return "#00ff00"  # Gruen
        elif db < 50:
            return "#ffff00"  # Gelb
        elif db < 55:
            return "#ff9900"  # Orange
        elif db < 60:
            return "#ff6600"  # Dunkelorange
        else:
            return "#ff0000"  # Rot


# ==============================================================================
# PERFORMANCE-BENCHMARK
# ==============================================================================


def benchmark_performance():
    """Vergleicht Performance von Original vs. Optimiert."""
    import time

    from .iso9613 import ISO9613Calculator, NoiseSource

    print("\n=== ISO 9613-2 Performance Benchmark ===\n")

    source = NoiseSource.typical_drone(x=0, y=0, z=50)
    bbox = (-500, -500, 500, 500)
    grid_sizes = [50, 20, 10, 5]

    for gs in grid_sizes:
        n_points = ((1000 / gs) + 1) ** 2

        # Original
        calc_orig = ISO9613Calculator()
        t0 = time.perf_counter()
        _ = calc_orig.calculate_grid(source, bbox, grid_size=gs)
        t_orig = time.perf_counter() - t0

        # Optimiert
        calc_fast = FastISO9613Calculator()
        t0 = time.perf_counter()
        _ = calc_fast.calculate_grid_fast(
            source_pos=(source.x, source.y, source.z),
            source_lw=source.lw,
            bbox=bbox,
            grid_size=gs,
        )
        t_fast = time.perf_counter() - t0

        speedup = t_orig / t_fast if t_fast > 0 else float("inf")

        print(f"Grid {gs}m ({int(n_points):,} Punkte):")
        print(f"  Original:  {t_orig:.3f}s")
        print(f"  Optimiert: {t_fast:.3f}s")
        print(f"  Speedup:   {speedup:.1f}x\n")

    print(f"Numba verfuegbar: {NUMBA_AVAILABLE}")


if __name__ == "__main__":
    benchmark_performance()
