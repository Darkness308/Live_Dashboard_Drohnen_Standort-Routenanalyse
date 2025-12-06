# Claude Code Konfiguration - MORPHEUS Dashboard

Dieser Ordner enthält die Claude Code Konfiguration für das MORPHEUS Dashboard Projekt.

## Struktur

```
.claude/
├── README.md              # Diese Datei
├── settings.json          # Projekt-Einstellungen (shared)
├── settings.local.json    # Lokale Einstellungen (hooks, permissions)
└── commands/              # Custom Slash-Commands
    ├── fix-all.md         # /fix-all - Automatische Code-Reparatur
    ├── check-compliance.md # /check-compliance - Regulatorische Prüfung
    ├── run-tests.md       # /run-tests - Testsuite ausführen
    ├── wfs-status.md      # /wfs-status - WFS-Dienste prüfen
    ├── audit-log.md       # /audit-log - Audit-Logs verwalten
    ├── create-feature.md  # /create-feature - Neues Feature erstellen
    ├── deploy.md          # /deploy - Deployment vorbereiten
    └── iso9613-calc.md    # /iso9613-calc - Lärmberechnung
```

## Verfügbare Commands

| Command | Beschreibung |
|---------|-------------|
| `/fix-all` | Führt automatische Linting- und Formatierungs-Fixes durch |
| `/check-compliance` | Prüft GPS-Präzision, TA Lärm, Sicherheit, WCAG |
| `/run-tests` | Führt Backend-Tests mit Coverage aus |
| `/wfs-status` | Prüft Geoportal NRW WFS-Dienste |
| `/audit-log` | Verwaltet gerichtsfeste Audit-Logs |
| `/create-feature` | Erstellt Boilerplate für neues Feature |
| `/deploy` | Führt Pre-Deployment-Checks durch |
| `/iso9613-calc` | Berechnet Lärmausbreitung nach ISO 9613-2 |

## Einstellungen

### settings.json (Projektweite Einstellungen)

- **Code Style**: Black + Ruff (Python), ESLint Airbnb (JavaScript)
- **Testing**: pytest mit 80% Coverage-Threshold
- **Security**: Secret-Scanning aktiviert
- **Compliance**: ISO 9613-2, TA Lärm, WCAG 2.1 AA

### settings.local.json (Lokale Einstellungen)

- **Hooks**: Pre-Commit Linting, Post-Tool-Use Notifications
- **Permissions**: Bash, File Write, Network erlaubt
- **Blocked Commands**: Destruktive git-Befehle blockiert

## Hooks

### Pre-Commit Hook

Vor jedem Commit werden automatisch ausgeführt:
- `ruff check .` - Python Linting
- `black --check .` - Python Formatierung

### Pre-Tool-Use Hook

Bei File-Modifikationen wird eine Erinnerung angezeigt, Tests zu führen.

## Verwendung

1. Öffne Claude Code im Projektverzeichnis
2. Verwende `/command-name` um einen Command auszuführen
3. Die Einstellungen werden automatisch geladen

## Compliance Standards

Dieses Projekt muss folgende Standards einhalten:

- **ISO 9613-2:1996** - Schallausbreitung im Freien
- **TA Lärm 1998** - Technische Anleitung zum Schutz gegen Lärm
- **WCAG 2.1 AA** - Web Content Accessibility Guidelines
- **EU 2019/947** - Drohnenverordnung

## Wichtige Regeln

1. GPS-Koordinaten müssen **exakt 6 Dezimalstellen** haben
2. **Keine hardcodierten API-Keys** im Code
3. Audit-Logs dürfen **niemals gelöscht** werden
4. Alle Berechnungen müssen **nachvollziehbar dokumentiert** sein
