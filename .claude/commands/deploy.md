# Deploy - Deployment vorbereiten und ausführen

Bereite ein Deployment für das MORPHEUS Dashboard vor:

## Pre-Deployment Checks

Führe alle Checks durch bevor deployed wird:

### 1. Code Quality

```bash
# Backend
cd backend
ruff check .
black --check .
mypy . --ignore-missing-imports

# Frontend
eslint assets/*.js
```

### 2. Tests

```bash
cd backend
pytest tests/ -v --cov=. --cov-fail-under=80
```

### 3. Security Scan

- Prüfe auf hardcodierte API-Keys
- Führe `safety check -r requirements.txt` aus
- Führe `bandit -r backend/ -ll` aus

### 4. Accessibility

- Prüfe WCAG 2.1 AA Compliance
- Validiere ARIA Attribute

## Build

```bash
# Erstelle Build-Verzeichnis
mkdir -p build
cp -r index.html assets build/
cp .env.example build/
```

## Deployment Options

### GitHub Pages

```bash
git checkout gh-pages || git checkout -b gh-pages
cp -r build/* .
git add .
git commit -m "Deploy: $(date +%Y-%m-%d)"
git push origin gh-pages
```

### Docker

```bash
cd backend
docker build -t morpheus-backend:latest .
docker tag morpheus-backend:latest ghcr.io/darkness308/morpheus-backend:latest
docker push ghcr.io/darkness308/morpheus-backend:latest
```

## Post-Deployment

1. Prüfe die Live-URL
2. Führe Smoke-Tests durch
3. Erstelle Release-Notes
4. Aktualisiere CHANGELOG.md
