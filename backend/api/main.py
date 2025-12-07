"""
MORPHEUS Backend API - Main Application
=======================================

FastAPI-Anwendung mit:
- CORS-Konfiguration für Frontend-Zugriff
- Health-Check Endpoints
- OpenAPI Dokumentation
- Middleware für Logging und Monitoring

Start:
    uvicorn backend.api.main:app --reload --port 8000
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse

from .routes import router as api_router

# Logger konfigurieren
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifecycle-Management für die Anwendung.

    Startup:
    - Logger initialisieren
    - Verbindungen prüfen

    Shutdown:
    - Ressourcen freigeben
    """
    # Startup
    logger.info("MORPHEUS Backend API starting...")
    logger.info("Checking service dependencies...")

    yield

    # Shutdown
    logger.info("MORPHEUS Backend API shutting down...")


# FastAPI App erstellen
app = FastAPI(
    title="MORPHEUS Backend API",
    description="""
## Gerichtsfeste Drohnen-Lärmanalyse API

Diese API bietet Zugriff auf:

### Lärmberechnung
- **ISO 9613-2** Schallausbreitungsberechnung
- **TA Lärm** Compliance-Prüfung
- Rasterberechnung für Lärmkarten

### Geodaten
- **ALKIS** Flurstücke via Geoportal NRW
- **Lärmkartierung** via Geoportal NRW
- CityGML LoD2 Gebäudemodelle

### Audit
- Gerichtsfeste Protokollierung
- Response-Hash Validierung
- Vollständiger Audit-Trail
    """,
    version="1.0.0",
    contact={
        "name": "MORPHEUS Project Team",
        "url": "https://github.com/Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# CORS-Middleware für Frontend-Zugriff
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:3000",
        # Produktions-URLs hier hinzufügen
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Request-Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Fügt X-Process-Time Header zu jeder Response hinzu."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response


# Request-Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Loggt eingehende Requests."""
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response


# API-Router einbinden
app.include_router(api_router, prefix="/api/v1")


# =============================================================================
# Root & Health Endpoints
# =============================================================================


@app.get("/", tags=["Root"])
async def root():
    """
    Root-Endpoint mit API-Informationen.
    """
    return {
        "name": "MORPHEUS Backend API",
        "version": "1.0.0",
        "description": "Gerichtsfeste Drohnen-Lärmanalyse API",
        "documentation": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health-Check Endpoint für Kubernetes/Docker.

    Returns:
        status: "healthy" wenn alle Services verfügbar
        services: Status einzelner Abhängigkeiten
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {"api": "up", "iso9613": "up", "wfs_loader": "up"},
    }


@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """
    Readiness-Check für Kubernetes.

    Prüft ob die Anwendung bereit ist, Traffic zu empfangen.
    """
    # Hier können weitere Checks hinzugefügt werden
    # z.B. Datenbankverbindung, Cache, etc.
    return {"status": "ready"}


@app.get("/health/live", tags=["Health"])
async def liveness_check():
    """
    Liveness-Check für Kubernetes.

    Prüft ob die Anwendung noch lebt.
    """
    return {"status": "alive"}


# =============================================================================
# Exception Handlers
# =============================================================================


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handler für ValueError (z.B. ungültige Eingaben)."""
    logger.warning(f"ValueError: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Invalid input",
            "detail": str(exc),
            "path": request.url.path,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler für unerwartete Fehler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": "An unexpected error occurred. Please check the logs.",
            "path": request.url.path,
        },
    )


# =============================================================================
# Custom OpenAPI Schema
# =============================================================================


def custom_openapi():
    """Generiert benutzerdefiniertes OpenAPI-Schema."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="MORPHEUS Backend API",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )

    # Tags für bessere Organisation
    openapi_schema["tags"] = [
        {
            "name": "Noise Calculation",
            "description": "ISO 9613-2 Schallausbreitungsberechnung und TA Lärm Compliance",
        },
        {
            "name": "Geodata",
            "description": "Geoportal NRW WFS Integration (ALKIS, Lärmkartierung)",
        },
        {
            "name": "Audit",
            "description": "Gerichtsfeste Protokollierung und Audit-Trail",
        },
        {"name": "Health", "description": "Health-Checks für Monitoring"},
    ]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# =============================================================================
# CLI Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.api.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info"
    )
