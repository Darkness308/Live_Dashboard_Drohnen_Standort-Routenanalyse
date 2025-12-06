# =============================================================================
# MORPHEUS Backend Dockerfile
# =============================================================================
# Multi-stage build für optimierte Image-Größe
#
# Build:   docker build -t morpheus-backend .
# Run:     docker run -p 8000:8000 morpheus-backend
# Dev:     docker run -p 8000:8000 -v $(pwd):/app morpheus-backend
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM python:3.11-slim as builder

# System-Abhängigkeiten für GeoPandas/GDAL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# GDAL Environment
ENV GDAL_CONFIG=/usr/bin/gdal-config

# Arbeitsverzeichnis
WORKDIR /app

# Requirements kopieren und installieren
COPY requirements.txt .

# Virtual Environment erstellen und aktivieren
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Python Dependencies installieren
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM python:3.11-slim as production

# Labels
LABEL maintainer="MORPHEUS Project Team"
LABEL description="MORPHEUS Backend API - ISO 9613-2 Noise Calculation"
LABEL version="1.0.0"

# System-Abhängigkeiten (Runtime only)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal32 \
    libgeos-c1v5 \
    libproj25 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Non-root User erstellen
RUN groupadd -r morpheus && useradd -r -g morpheus morpheus

# Arbeitsverzeichnis
WORKDIR /app

# Virtual Environment von Builder kopieren
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Anwendungscode kopieren
COPY . .

# Verzeichnisse für Cache und Logs erstellen
RUN mkdir -p /app/cache/nrw_data /app/logs && \
    chown -R morpheus:morpheus /app

# Als non-root User ausführen
USER morpheus

# Environment Variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=8000

# Health-Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Port freigeben
EXPOSE ${PORT}

# Uvicorn starten
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]


# -----------------------------------------------------------------------------
# Stage 3: Development (optional)
# -----------------------------------------------------------------------------
FROM production as development

# Als root für Development
USER root

# Development-Tools installieren
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    pytest-asyncio \
    httpx \
    black \
    ruff \
    mypy

# Zurück zu non-root für Ausführung
USER morpheus

# Hot-Reload aktivieren
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
