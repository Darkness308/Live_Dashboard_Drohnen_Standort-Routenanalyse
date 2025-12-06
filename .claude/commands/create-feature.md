# Create Feature - Neues Feature erstellen

Erstelle ein neues Feature für das MORPHEUS Dashboard:

## Eingabe erforderlich

Frage nach:
1. **Feature Name**: Kurzer, beschreibender Name
2. **Bereich**: `frontend` | `backend` | `integration` | `calculation`
3. **Beschreibung**: Was soll das Feature tun?

## Branch erstellen

```bash
git checkout -b feature/<bereich>/<feature-name>
```

Beispiel: `feature/backend/bodeneffekt-berechnung`

## Dateien erstellen

### Backend Feature

1. Erstelle Modul in `backend/<bereich>/<feature>.py`
2. Erstelle Tests in `backend/tests/test_<feature>.py`
3. Aktualisiere `backend/__init__.py` falls nötig

Template:
```python
"""
<Feature Name> - <Kurzbeschreibung>

Erstellt: <Datum>
Version: 1.0.0
"""

from typing import Optional
from pydantic import BaseModel


class <FeatureName>:
    """<Docstring>"""

    def __init__(self):
        pass
```

### Frontend Feature

1. Erstelle Modul in `assets/<feature>.js`
2. Aktualisiere `index.html` falls nötig

Template:
```javascript
/**
 * <Feature Name> - <Kurzbeschreibung>
 * @module <feature>
 * @version 1.0.0
 */

const <FeatureName> = {
    init() {},
    update() {},
    render() {}
};
```

## Checkliste

- [ ] Type Hints (Python) / JSDoc (JavaScript)
- [ ] Unit Tests erstellt
- [ ] WCAG 2.1 AA konform (Frontend)
- [ ] Audit-Logging (wenn Daten verarbeitet werden)
- [ ] README/Docs aktualisiert
