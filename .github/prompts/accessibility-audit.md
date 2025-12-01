# Accessibility Audit Prompt - MORPHEUS Dashboard

> WCAG 2.1 Level AA Compliance Audit Guide

## ♿ Accessibility Framework

Dieser Prompt führt dich durch einen vollständigen WCAG 2.1 Level AA Accessibility Audit für das MORPHEUS Dashboard.

---

## 📋 WCAG 2.1 AA Audit-Checkliste

### 1. Perceivable (Wahrnehmbar)

#### 1.1 Text Alternatives (Textalternativen)

**1.1.1 Non-text Content (Level A)**

**Prüfe:**
- [ ] Alle Bilder haben aussagekräftige `alt`-Attribute
- [ ] Dekorative Bilder haben `alt=""` oder `role="presentation"`
- [ ] Icons haben ARIA-Labels oder sind mit Text kombiniert
- [ ] Maps haben `role="application"` und `aria-label`
- [ ] Charts haben aussagekräftige Beschreibungen

```html
<!-- ✅ RICHTIG: Informatives Bild -->
<img src="drone.png" alt="DJI Mavic 3 Drohne im Flug über Iserlohn">

<!-- ✅ RICHTIG: Dekoratives Bild -->
<img src="decoration.png" alt="" role="presentation">

<!-- ✅ RICHTIG: Icon mit Label -->
<button aria-label="Toggle noise heatmap">
  <span class="icon-map" aria-hidden="true">🗺️</span>
</button>

<!-- ✅ RICHTIG: Interactive Map -->
<div 
  id="map" 
  role="application" 
  aria-label="Interactive map showing 3 drone routes and 10 noise measurement points in Iserlohn, Germany"
  tabindex="0">
</div>

<!-- ❌ FALSCH: Fehlendes alt -->
<img src="chart.png">

<!-- ❌ FALSCH: Nicht-beschreibendes alt -->
<img src="route-map.png" alt="image">
```

#### 1.2 Time-based Media (Zeitbasierte Medien)

**N/A** - Keine Videos/Audio im Dashboard

#### 1.3 Adaptable (Anpassbar)

**1.3.1 Info and Relationships (Level A)**

**Prüfe:**
- [ ] Semantic HTML verwendet (`<header>`, `<main>`, `<nav>`, `<section>`)
- [ ] Heading-Hierarchie korrekt (`<h1>` → `<h2>` → `<h3>`)
- [ ] Listen verwenden `<ul>`, `<ol>`, `<li>`
- [ ] Tabellen verwenden `<table>`, `<th>`, `<td>` mit `scope`
- [ ] Formulare haben `<label>` für jedes Input

```html
<!-- ✅ RICHTIG: Semantic HTML -->
<header role="banner">
  <h1>MORPHEUS Dashboard</h1>
  <nav role="navigation" aria-label="Main navigation">
    <ul>
      <li><a href="#map">Karte</a></li>
      <li><a href="#routes">Routen</a></li>
    </ul>
  </nav>
</header>

<main id="main-content" role="main">
  <section aria-labelledby="fleet-heading">
    <h2 id="fleet-heading">Flottenstand</h2>
    <!-- Content -->
  </section>
  
  <section aria-labelledby="routes-heading">
    <h2 id="routes-heading">Routenvergleich</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">Route</th>
          <th scope="col">Distanz</th>
          <th scope="col">Compliance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Route A</th>
          <td>8.5 km</td>
          <td>✓ Konform</td>
        </tr>
      </tbody>
    </table>
  </section>
</main>

<!-- ❌ FALSCH: Non-semantic -->
<div class="header">
  <div class="title">MORPHEUS Dashboard</div>
  <div class="nav">
    <div><a href="#map">Karte</a></div>
  </div>
</div>
```

**1.3.2 Meaningful Sequence (Level A)**

**Prüfe:**
- [ ] Tab-Order logisch und intuitiv
- [ ] Content-Order im DOM entspricht visueller Order
- [ ] `tabindex` nur bei Bedarf verwendet (nicht >0)

```html
<!-- ✅ RICHTIG: Logische Reihenfolge -->
<nav>
  <button tabindex="0">Home</button>
  <button tabindex="0">Routen</button>
  <button tabindex="0">Settings</button>
</nav>

<!-- ❌ FALSCH: Verwirrende Tab-Order -->
<nav>
  <button tabindex="3">Home</button>
  <button tabindex="1">Routen</button>
  <button tabindex="2">Settings</button>
</nav>
```

**1.3.3 Sensory Characteristics (Level A)**

**Prüfe:**
- [ ] Instruktionen verlassen sich nicht nur auf Farbe
- [ ] Instruktionen verlassen sich nicht nur auf Form
- [ ] Instruktionen verlassen sich nicht nur auf Position

```html
<!-- ✅ RICHTIG: Multi-sensory cues -->
<p>
  Klicken Sie auf die <strong>grüne</strong> Schaltfläche mit dem 
  <span aria-label="Häkchen-Symbol">✓</span> "Speichern" Text 
  unten rechts im Formular.
</p>

<!-- ❌ FALSCH: Nur Farbe -->
<p>Klicken Sie auf die grüne Schaltfläche</p>

<!-- ❌ FALSCH: Nur Position -->
<p>Klicken Sie auf die Schaltfläche rechts</p>
```

#### 1.4 Distinguishable (Unterscheidbar)

**1.4.1 Use of Color (Level A)**

**Prüfe:**
- [ ] Farbe ist nicht die einzige Methode zur Informationsvermittlung
- [ ] Status wird auch durch Icons/Text angezeigt
- [ ] Links sind von normalem Text unterscheidbar (nicht nur durch Farbe)

```html
<!-- ✅ RICHTIG: Farbe + Icon + Text -->
<span class="status-badge status-success">
  <span class="icon" aria-hidden="true">✓</span>
  <span class="text">TA Lärm Konform</span>
</span>

<span class="status-badge status-error">
  <span class="icon" aria-hidden="true">✗</span>
  <span class="text">Nicht Konform</span>
</span>

<!-- ❌ FALSCH: Nur Farbe -->
<span class="status-success">Status</span>
<span class="status-error">Status</span>
```

**1.4.3 Contrast (Minimum) (Level AA)**

**Pflicht-Kontrastverhältnisse:**
- Normal text (< 18pt): **≥4.5:1**
- Large text (≥18pt oder ≥14pt bold): **≥3:1**
- UI components & graphics: **≥3:1**

**Prüfe:**
- [ ] Normaler Text: Kontrast ≥4.5:1
- [ ] Großer Text: Kontrast ≥3:1
- [ ] Buttons/Controls: Kontrast ≥3:1
- [ ] Focus-Indicators: Kontrast ≥3:1

**Test-Tools:**
- Chrome DevTools: Lighthouse Accessibility Audit
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)

```css
/* ✅ RICHTIG: Ausreichender Kontrast */
.text-primary {
  color: #1F2937;  /* Dark gray on white: 15.1:1 ✓ */
  background: #FFFFFF;
}

.button-primary {
  color: #FFFFFF;  /* White on blue: 4.6:1 ✓ */
  background: #3B82F6;
}

/* ❌ FALSCH: Unzureichender Kontrast */
.text-gray {
  color: #9CA3AF;  /* Light gray on white: 2.5:1 ✗ */
  background: #FFFFFF;
}
```

**1.4.4 Resize Text (Level AA)**

**Prüfe:**
- [ ] Text kann auf 200% vergrößert werden ohne Funktionsverlust
- [ ] Keine horizontalen Scrollbars bei 200% Zoom
- [ ] Layout bricht nicht bei Text-Vergrößerung

```css
/* ✅ RICHTIG: Responsive Text */
body {
  font-size: 16px;
  line-height: 1.5;
}

h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
}

/* Container passt sich an */
.container {
  max-width: 100%;
  overflow-wrap: break-word;
}

/* ❌ FALSCH: Fixed Sizes */
.text {
  font-size: 14px !important;  /* Blockiert User-Zoom */
  width: 800px;  /* Bricht bei kleinen Screens */
  overflow: hidden;  /* Versteckt Content */
}
```

**1.4.10 Reflow (Level AA)**

**Prüfe:**
- [ ] Content funktioniert bei 320px Breite
- [ ] Keine horizontale Scrollbar bei Zoom
- [ ] Responsive Design aktiviert

```css
/* ✅ RICHTIG: Mobile First */
.dashboard {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .dashboard {
    padding: 2rem;
  }
}

/* ❌ FALSCH: Fixed Width */
.dashboard {
  width: 1200px;  /* Bricht auf Mobile */
  min-width: 1000px;
}
```

**1.4.11 Non-text Contrast (Level AA)**

**Prüfe:**
- [ ] UI-Komponenten: Kontrast ≥3:1 gegen angrenzende Farben
- [ ] Grafische Objekte: Kontrast ≥3:1
- [ ] Focus-Indicators: Kontrast ≥3:1

```css
/* ✅ RICHTIG: Focus Indicator mit Kontrast */
button:focus {
  outline: 3px solid #3B82F6;  /* Blue: 3.1:1 gegen Weiß ✓ */
  outline-offset: 2px;
}

input:focus {
  border: 2px solid #2563EB;  /* Darker blue: 4.5:1 ✓ */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

/* ❌ FALSCH: Schwacher Kontrast */
button:focus {
  outline: 1px solid #E5E7EB;  /* Light gray: 1.2:1 ✗ */
}
```

**1.4.12 Text Spacing (Level AA)**

**Prüfe:**
- [ ] Line height mindestens 1.5x Font-Size
- [ ] Paragraph spacing mindestens 2x Font-Size
- [ ] Letter spacing mindestens 0.12x Font-Size
- [ ] Word spacing mindestens 0.16x Font-Size

```css
/* ✅ RICHTIG: Ausreichende Abstände */
body {
  font-size: 16px;
  line-height: 1.5;  /* 24px (≥1.5x) ✓ */
  letter-spacing: 0.02em;  /* ≥0.12x ✓ */
  word-spacing: 0.16em;  /* ≥0.16x ✓ */
}

p {
  margin-bottom: 2em;  /* ≥2x Font-Size ✓ */
}

/* ❌ FALSCH: Zu eng */
.cramped-text {
  line-height: 1.0;  /* Zu eng ✗ */
  letter-spacing: 0;
  word-spacing: 0;
}
```

**1.4.13 Content on Hover or Focus (Level AA)**

**Prüfe:**
- [ ] Hover/Focus Content ist dismissable (ESC schließt)
- [ ] Hover/Focus Content ist hoverable (Maus kann darüber)
- [ ] Hover/Focus Content ist persistent (bleibt bis Dismiss)

```javascript
// ✅ RICHTIG: Dismissable Tooltip
function showTooltip(element, content) {
  const tooltip = createTooltip(content);
  
  // Dismissable mit ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      tooltip.remove();
    }
  });
  
  // Hoverable - Tooltip bleibt auch über Tooltip
  tooltip.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
  });
  
  // Persistent - verschwindet nur bei explicit Dismiss
  element.addEventListener('mouseleave', () => {
    hideTimeout = setTimeout(() => tooltip.remove(), 300);
  });
}
```

---

### 2. Operable (Bedienbar)

#### 2.1 Keyboard Accessible (Tastatur-zugänglich)

**2.1.1 Keyboard (Level A)**

**Prüfe:**
- [ ] Alle Funktionen mit Tastatur erreichbar
- [ ] Tab, Shift+Tab für Navigation
- [ ] Enter/Space für Aktivierung
- [ ] Pfeiltasten für Menüs/Slider
- [ ] ESC zum Schließen von Dialogen

```html
<!-- ✅ RICHTIG: Keyboard-accessible Button -->
<button 
  id="toggleHeatmap"
  onclick="toggleHeatmap()"
  onkeydown="handleKeydown(event)">
  Toggle Heatmap
</button>

<script>
function handleKeydown(event) {
  // Enter oder Space aktiviert Button
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleHeatmap();
  }
  
  // ESC schließt Overlay
  if (event.key === 'Escape') {
    closeHeatmap();
  }
}
</script>

<!-- ❌ FALSCH: Nur Maus -->
<div onclick="toggleHeatmap()">Toggle</div>
```

**2.1.2 No Keyboard Trap (Level A)**

**Prüfe:**
- [ ] Focus kann aus allen Komponenten bewegt werden
- [ ] Keine "Keyboard Traps" in Modals oder Custom Widgets
- [ ] ESC schließt Overlays/Modals

```javascript
// ✅ RICHTIG: Focus Management in Modal
function openModal() {
  const modal = document.getElementById('modal');
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Trap focus inside modal
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
    
    // ESC closes modal
    if (e.key === 'Escape') {
      closeModal();
    }
  });
  
  firstElement.focus();
}
```

**2.1.4 Character Key Shortcuts (Level A)**

**Prüfe:**
- [ ] Single-key shortcuts können deaktiviert werden
- [ ] Single-key shortcuts nur bei Focus aktiv
- [ ] Alternative Multi-key shortcuts verfügbar

#### 2.2 Enough Time (Ausreichend Zeit)

**N/A** - Keine zeitbasierten Funktionen

#### 2.3 Seizures and Physical Reactions (Anfälle vermeiden)

**2.3.1 Three Flashes or Below Threshold (Level A)**

**Prüfe:**
- [ ] Keine Inhalte blinken mehr als 3x pro Sekunde
- [ ] Animationen respektieren `prefers-reduced-motion`

```css
/* ✅ RICHTIG: Respektiert User-Präferenz */
.animated {
  animation: fadeIn 0.3s ease-in;
}

@media (prefers-reduced-motion: reduce) {
  .animated {
    animation: none;
    transition: none;
  }
}

/* ❌ FALSCH: Aggressive Blink-Animation */
.blink {
  animation: blink 0.2s infinite;  /* 5x pro Sekunde! ✗ */
}
```

#### 2.4 Navigable (Navigierbar)

**2.4.1 Bypass Blocks (Level A)**

**Prüfe:**
- [ ] "Skip to main content" Link vorhanden
- [ ] Skip Link ist erstes tabbable Element
- [ ] Skip Link funktioniert korrekt

```html
<!-- ✅ RICHTIG: Skip Link -->
<body>
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
  
  <header>
    <!-- Navigation -->
  </header>
  
  <main id="main-content" tabindex="-1">
    <!-- Main Content -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 1em;
  background-color: #000;
  color: #fff;
  text-decoration: none;
}

.skip-link:focus {
  left: 50%;
  transform: translateX(-50%);
  top: 0;
}
</style>
```

**2.4.3 Focus Order (Level A)**

**Prüfe:**
- [ ] Tab-Order logisch (links nach rechts, oben nach unten)
- [ ] Focus folgt visueller Anordnung
- [ ] Keine confusing tab jumps

**2.4.6 Headings and Labels (Level AA)**

**Prüfe:**
- [ ] Alle Abschnitte haben Headings
- [ ] Headings beschreiben Inhalt klar
- [ ] Alle Form-Inputs haben Labels

```html
<!-- ✅ RICHTIG: Klare Headings und Labels -->
<section aria-labelledby="fleet-heading">
  <h2 id="fleet-heading">Flottenstand - Aktuelle Drohnenpositionen</h2>
  <!-- Content -->
</section>

<form>
  <label for="routeSelect">
    Wählen Sie eine Route zur Anzeige:
  </label>
  <select id="routeSelect" aria-describedby="routeHelp">
    <option value="route1">Route A - Optimiert</option>
    <option value="route2">Route B - Lärmminimiert</option>
  </select>
  <span id="routeHelp" class="help-text">
    Route A ist die empfohlene Standardroute.
  </span>
</form>

<!-- ❌ FALSCH: Unklare Headings -->
<h2>Daten</h2>
<h2>Info</h2>
```

**2.4.7 Focus Visible (Level AA)**

**Prüfe:**
- [ ] Focus-Indicator immer sichtbar
- [ ] Focus-Indicator hat ausreichenden Kontrast
- [ ] Focus-Indicator mindestens 2px

```css
/* ✅ RICHTIG: Sichtbarer Focus */
button:focus,
a:focus,
input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Alternative: Box Shadow */
.custom-button:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* ❌ FALSCH: Focus entfernt */
*:focus {
  outline: none;  /* NIE machen! */
}
```

---

### 3. Understandable (Verständlich)

#### 3.1 Readable (Lesbar)

**3.1.1 Language of Page (Level A)**

**Prüfe:**
- [ ] `lang` Attribut auf `<html>`
- [ ] Sprachwechsel mit `lang` markiert

```html
<!-- ✅ RICHTIG: Sprache definiert -->
<html lang="de">
<head>
  <title>MORPHEUS Dashboard</title>
</head>
<body>
  <p>Deutscher Text hier.</p>
  
  <!-- Englischer Abschnitt -->
  <blockquote lang="en">
    English text in quote.
  </blockquote>
</body>
</html>
```

**3.1.2 Language of Parts (Level AA)**

**Prüfe:**
- [ ] Fremdsprachige Abschnitte haben `lang` Attribut

#### 3.2 Predictable (Vorhersehbar)

**3.2.1 On Focus (Level A)**

**Prüfe:**
- [ ] Focus ändert keinen Context (keine Auto-Submits)
- [ ] Fokussieren eines Elements löst keine Navigation aus

**3.2.2 On Input (Level A)**

**Prüfe:**
- [ ] Eingabe ändert keinen Context ohne Warnung
- [ ] Select-Changes erfordern Submit-Button

```html
<!-- ✅ RICHTIG: Expliziter Submit -->
<form>
  <label for="languageSelect">Sprache:</label>
  <select id="languageSelect">
    <option value="de">Deutsch</option>
    <option value="en">English</option>
  </select>
  <button type="submit">Anwenden</button>
</form>

<!-- ❌ FALSCH: Auto-Submit bei Change -->
<select onchange="this.form.submit()">
  <option>DE</option>
  <option>EN</option>
</select>
```

**3.2.3 Consistent Navigation (Level AA)**

**Prüfe:**
- [ ] Navigation in gleicher Reihenfolge auf allen Seiten
- [ ] Gleiche Komponenten funktionieren gleich

**3.2.4 Consistent Identification (Level AA)**

**Prüfe:**
- [ ] Gleiche Funktionen haben gleiche Labels
- [ ] Icons sind konsistent

#### 3.3 Input Assistance (Eingabe-Unterstützung)

**3.3.1 Error Identification (Level A)**

**Prüfe:**
- [ ] Fehler werden klar identifiziert
- [ ] Fehler-Messages sind verständlich
- [ ] Fehler werden in Text beschrieben (nicht nur Farbe)

```html
<!-- ✅ RICHTIG: Klare Fehlermeldung -->
<div class="form-group" aria-describedby="email-error">
  <label for="email">E-Mail:</label>
  <input 
    type="email" 
    id="email" 
    aria-invalid="true"
    aria-describedby="email-error">
  <span id="email-error" class="error-message" role="alert">
    <span class="icon" aria-hidden="true">⚠️</span>
    Fehler: Bitte geben Sie eine gültige E-Mail-Adresse ein.
  </span>
</div>

<!-- ❌ FALSCH: Unklarer Fehler -->
<input type="email" class="error">
<span class="red">Ungültig</span>
```

**3.3.2 Labels or Instructions (Level A)**

**Prüfe:**
- [ ] Alle Inputs haben Labels
- [ ] Komplexe Inputs haben Instructions
- [ ] Required Fields sind markiert

```html
<!-- ✅ RICHTIG: Label + Instructions -->
<div class="form-group">
  <label for="apiKey">
    Google Maps API Key <span class="required" aria-label="erforderlich">*</span>
  </label>
  <input 
    type="text" 
    id="apiKey" 
    required
    aria-required="true"
    aria-describedby="apiKeyHelp">
  <span id="apiKeyHelp" class="help-text">
    Ihr API Key beginnt mit "AIzaSy". 
    <a href="/help/api-key">Wo finde ich meinen API Key?</a>
  </span>
</div>
```

---

### 4. Robust (Robust)

#### 4.1 Compatible (Kompatibel)

**4.1.1 Parsing (Level A)**

**Prüfe:**
- [ ] HTML ist valide (W3C Validator)
- [ ] Keine doppelten IDs
- [ ] Tags sind korrekt geschlossen
- [ ] Attribute sind korrekt geschrieben

```bash
# HTML Validation
npx html-validate index.html

# ODER online:
# https://validator.w3.org/
```

**4.1.2 Name, Role, Value (Level A)**

**Prüfe:**
- [ ] Alle UI-Komponenten haben Name (label/aria-label)
- [ ] Alle UI-Komponenten haben Role (button/link/etc)
- [ ] Alle UI-Komponenten haben State (aria-pressed/aria-expanded)

```html
<!-- ✅ RICHTIG: Name, Role, Value -->
<button 
  id="toggleRouteA"
  role="button"
  aria-label="Toggle Route A visibility"
  aria-pressed="false"
  onclick="toggleRoute('A')">
  <span class="route-indicator" aria-hidden="true"></span>
  Route A
</button>

<!-- Custom Checkbox -->
<div 
  role="checkbox"
  aria-checked="false"
  aria-labelledby="heatmap-label"
  tabindex="0"
  onkeydown="handleCheckboxKey(event)"
  onclick="toggleCheckbox()">
  <span id="heatmap-label">Show Heatmap</span>
</div>
```

---

## 🧪 Testing-Tools

### Automatisierte Tests

#### 1. Chrome DevTools Lighthouse
```javascript
// Open DevTools → Lighthouse Tab
// Run Accessibility Audit
// Target Score: 100
```

#### 2. axe DevTools
```bash
# Install browser extension
# Chrome: https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/

# Run audit → Fix issues → Re-run
```

#### 3. WAVE
```
# Online tool: https://wave.webaim.org/
# Paste URL or install browser extension
# Check for errors and warnings
```

### Manuelle Tests

#### Keyboard Navigation
1. **Tab durch alle interaktive Elemente**
   - Erwartung: Logische Reihenfolge, alle erreichbar
2. **Enter/Space auf Buttons**
   - Erwartung: Aktivierung funktioniert
3. **Pfeiltasten in Menüs/Listen**
   - Erwartung: Navigation funktioniert
4. **ESC in Overlays/Modals**
   - Erwartung: Schließt das Overlay

#### Screen Reader
1. **NVDA (Windows)** oder **VoiceOver (Mac)**
2. **Teste Navigation**
   - Headings: H key
   - Links: K key
   - Buttons: B key
   - Landmarks: D key
3. **Teste Formulare**
   - Labels werden vorgelesen
   - Errors werden angekündigt
4. **Teste interaktive Elemente**
   - State Changes werden angekündigt
   - Dynamic Content wird angekündigt

---

## ✅ Accessibility Audit Checkliste

### WCAG 2.1 Level A
- [ ] 1.1.1 Non-text Content
- [ ] 1.3.1 Info and Relationships
- [ ] 1.3.2 Meaningful Sequence
- [ ] 1.3.3 Sensory Characteristics
- [ ] 1.4.1 Use of Color
- [ ] 2.1.1 Keyboard
- [ ] 2.1.2 No Keyboard Trap
- [ ] 2.1.4 Character Key Shortcuts
- [ ] 2.3.1 Three Flashes or Below
- [ ] 2.4.1 Bypass Blocks
- [ ] 2.4.3 Focus Order
- [ ] 3.1.1 Language of Page
- [ ] 3.2.1 On Focus
- [ ] 3.2.2 On Input
- [ ] 3.3.1 Error Identification
- [ ] 3.3.2 Labels or Instructions
- [ ] 4.1.1 Parsing
- [ ] 4.1.2 Name, Role, Value

### WCAG 2.1 Level AA (zusätzlich)
- [ ] 1.3.4 Orientation
- [ ] 1.3.5 Identify Input Purpose
- [ ] 1.4.3 Contrast (Minimum)
- [ ] 1.4.4 Resize Text
- [ ] 1.4.5 Images of Text
- [ ] 1.4.10 Reflow
- [ ] 1.4.11 Non-text Contrast
- [ ] 1.4.12 Text Spacing
- [ ] 1.4.13 Content on Hover or Focus
- [ ] 2.4.5 Multiple Ways
- [ ] 2.4.6 Headings and Labels
- [ ] 2.4.7 Focus Visible
- [ ] 3.1.2 Language of Parts
- [ ] 3.2.3 Consistent Navigation
- [ ] 3.2.4 Consistent Identification
- [ ] 3.3.3 Error Suggestion
- [ ] 3.3.4 Error Prevention

### Browser Testing
- [ ] Chrome 100+ (Desktop & Mobile)
- [ ] Firefox 100+ (Desktop & Mobile)
- [ ] Safari 15+ (Desktop & iOS)
- [ ] Edge 90+

### Screen Reader Testing
- [ ] NVDA (Windows) + Chrome/Firefox
- [ ] JAWS (Windows) + Chrome/Edge
- [ ] VoiceOver (Mac) + Safari
- [ ] VoiceOver (iOS) + Safari

### Keyboard Testing
- [ ] Tab navigation funktioniert
- [ ] Shift+Tab rückwärts funktioniert
- [ ] Enter/Space aktiviert Elemente
- [ ] Pfeiltasten in Menüs/Listen
- [ ] ESC schließt Overlays

---

## 📚 Referenzen

- **[WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)**: Official Guidelines
- **[WebAIM](https://webaim.org/)**: Accessibility Resources
- **[axe Accessibility](https://www.deque.com/axe/)**: Testing Tools
- **[A11y Project](https://www.a11yproject.com/)**: Best Practices
- **[ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)**: ARIA Patterns

---

**Accessibility Audit Complete!** ♿

Ein zugängliches Dashboard ist ein besseres Dashboard für alle Benutzer.
