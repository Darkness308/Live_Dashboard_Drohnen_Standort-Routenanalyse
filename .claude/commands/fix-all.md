# Fix All - Automatische Code-Reparatur

Führe eine vollständige automatische Code-Reparatur durch:

## Backend (Python)

1. Wechsle ins `backend/` Verzeichnis
2. Führe `autoflake --in-place --remove-all-unused-imports --recursive .` aus
3. Führe `isort . --profile black` aus
4. Führe `ruff check . --fix --unsafe-fixes` aus
5. Führe `black .` aus
6. Führe `mypy . --ignore-missing-imports` aus und zeige verbleibende Fehler

## Frontend (JavaScript)

1. Prüfe ob `.eslintrc.json` existiert
2. Führe `eslint assets/*.js --fix` aus
3. Zeige verbleibende Fehler

## Validierung

1. Führe `ruff check backend/` aus
2. Führe `black --check backend/` aus
3. Zeige eine Zusammenfassung der Ergebnisse

## Abschluss

Wenn alle Checks grün sind, frage ob ein Commit erstellt werden soll mit der Message:
`fix: Auto-fix linting and formatting issues`
