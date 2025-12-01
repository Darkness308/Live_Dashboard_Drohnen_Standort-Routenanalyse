# GitHub Copilot Configuration - MORPHEUS Dashboard

> Comprehensive GitHub Copilot configuration for intelligent code assistance

## 📋 Overview

This directory contains a complete GitHub Copilot configuration setup for the MORPHEUS Drohnen-Standort & Routenanalyse Dashboard. It includes instructions, specialized prompts, automated workflows, and templates to ensure consistent, high-quality development.

---

## 📁 Directory Structure

```
.github/
├── copilot-instructions.md          # Main Copilot instructions file
├── CODEOWNERS                        # Code ownership definitions
├── PULL_REQUEST_TEMPLATE.md         # PR template with comprehensive checklist
├── prompts/                          # Specialized task prompts
│   ├── code-review.md               # Systematic code review guidelines
│   ├── feature-development.md       # New feature development workflow
│   ├── bug-fix.md                   # Bug fixing procedures
│   ├── documentation.md             # Documentation creation/updates
│   ├── accessibility-audit.md       # WCAG 2.1 AA compliance audits
│   ├── google-maps-integration.md   # Google Maps API integration
│   └── ta-laerm-compliance.md       # TA Lärm compliance validation
└── workflows/                        # GitHub Actions CI/CD workflows
    ├── code-quality.yml             # Code quality checks
    ├── accessibility.yml            # Accessibility testing
    └── deployment-preview.yml       # Deployment previews
```

---

## 📖 Main Copilot Instructions

**File:** `copilot-instructions.md`

The main instructions file provides GitHub Copilot with comprehensive context about the MORPHEUS Dashboard project, including:

### Key Sections
- **Projektübersicht**: Project goals and target audience
- **Tech Stack**: HTML5, CSS3, JavaScript ES6+, Tailwind CSS, Chart.js, Google Maps API
- **Code-Standards**: Airbnb JavaScript Style Guide, naming conventions
- **Kritische Constraints**: 
  - GPS coordinates must have exactly 6 decimal places
  - TA Lärm thresholds validated against official sources
  - No hardcoded API keys
  - WCAG 2.1 AA compliance mandatory
- **Projektstruktur**: File responsibilities and architecture
- **Best Practices**: Accessibility-first, mobile-first, security guidelines

### Usage
GitHub Copilot automatically reads this file to provide context-aware suggestions throughout the codebase.

---

## 🎯 Specialized Prompts

Located in the `prompts/` directory, these files provide detailed guidance for specific development tasks.

### 1. Code Review (`code-review.md`)

**Purpose:** Systematic code review checklist  
**Key Areas:**
- Airbnb JavaScript Style Guide compliance
- GPS coordinate validation (6 decimal precision)
- API key security
- WCAG 2.1 AA accessibility
- TA Lärm threshold validation
- JSDoc completeness
- Responsive design
- Cross-browser compatibility

**When to Use:** Before merging any PR

### 2. Feature Development (`feature-development.md`)

**Purpose:** End-to-end feature development guide  
**Phases:**
1. Planning & Requirements
2. Architecture & Design
3. Implementation (Data, Map, Visualization, UI layers)
4. Internationalization
5. Testing
6. Documentation

**When to Use:** Developing new dashboard features

### 3. Bug Fix (`bug-fix.md`)

**Purpose:** Structured debugging and problem-solving  
**Process:**
1. Problem Identification
2. Root Cause Analysis
3. Bug Fixing
4. Verification
5. Documentation

**Common Bug Categories:**
- GPS coordinate errors
- Map rendering issues
- Chart display problems
- Accessibility violations
- Cross-browser compatibility

**When to Use:** Investigating and fixing bugs

### 4. Documentation (`documentation.md`)

**Purpose:** Creating and maintaining documentation  
**Types Covered:**
- JSDoc code documentation
- README.md updates
- API documentation
- Setup guides
- Troubleshooting guides
- Regulatory compliance references

**When to Use:** Adding or updating any documentation

### 5. Accessibility Audit (`accessibility-audit.md`)

**Purpose:** WCAG 2.1 Level AA compliance verification  
**Coverage:**
- Perceivable (alt text, semantic HTML, contrast)
- Operable (keyboard navigation, focus management)
- Understandable (language, predictable navigation)
- Robust (valid HTML, ARIA attributes)

**Tools Mentioned:**
- Chrome DevTools Lighthouse
- axe DevTools
- WAVE
- Screen readers (NVDA, JAWS, VoiceOver)

**When to Use:** Before any major release or UI changes

### 6. Google Maps Integration (`google-maps-integration.md`)

**Purpose:** Complete Google Maps API integration guide  
**Topics:**
- API key management (secure configuration)
- Map initialization
- Route rendering (polylines)
- Waypoint markers
- Immissionsorte (noise measurement points)
- Heatmap layer
- Event handling

**When to Use:** Working with Google Maps features

### 7. TA Lärm Compliance (`ta-laerm-compliance.md`)

**Purpose:** German noise regulation compliance  
**Content:**
- Official TA Lärm 1998 thresholds
- Compliance calculation functions
- Chart visualizations
- Report generation
- Test suites

**Grenzwerte (Validated):**
- Wohngebiet: Tag 55 dB(A), Nacht 40 dB(A)
- Gewerbegebiet: Tag 65 dB(A), Nacht 50 dB(A)
- Industriegebiet: 70 dB(A) (Tag/Nacht)

**When to Use:** Implementing or modifying noise compliance features

---

## ⚙️ GitHub Actions Workflows

### 1. Code Quality (`code-quality.yml`)

**Triggers:** Push/PR to main or develop branches

**Jobs:**
- **ESLint**: JavaScript linting with Airbnb style guide
- **HTML Validation**: W3C HTML validation
- **CSS Linting**: Stylelint checks
- **GPS Validation**: Ensures all coordinates have 6 decimals
- **Secret Scanning**: Detects hardcoded API keys
- **JSDoc Check**: Verifies function documentation completeness

**Purpose:** Maintain code quality and prevent common mistakes

### 2. Accessibility Testing (`accessibility.yml`)

**Triggers:** Push/PR to main or develop branches

**Jobs:**
- **axe-core Scanner**: Automated accessibility testing
- **WCAG Validation**: WCAG 2.1 AA compliance checks
- **ARIA Validation**: Validates ARIA attributes
- **Contrast Check**: Color contrast ratio validation

**Purpose:** Ensure WCAG 2.1 AA compliance

### 3. Deployment Preview (`deployment-preview.yml`)

**Triggers:** Pull requests to main or develop branches

**Jobs:**
- **Build**: Creates static site build
- **Deploy Preview**: Deploys to GitHub Pages preview branch
- **Lighthouse**: Performance and accessibility audits
- **Screenshots**: Cross-browser screenshots (Mobile, Tablet, Desktop)
- **Cleanup**: Removes preview branch when PR closes

**Purpose:** Preview changes before merging

---

## 👥 Code Ownership (CODEOWNERS)

**File:** `CODEOWNERS`

Defines code ownership for automatic review requests:

| Path Pattern | Owner | Purpose |
|--------------|-------|---------|
| `*` | @Darkness308 | Global fallback |
| `*.md` | @Darkness308 | All documentation |
| `/.github/` | @Darkness308 | GitHub configuration |
| `/assets/maps.js` | @Darkness308 | Google Maps integration |
| `/assets/data.js` | @Darkness308 | GPS data (critical) |
| `**/*ta-laerm*.*` | @Darkness308 | TA Lärm compliance |
| `**/*accessibility*.*` | @Darkness308 | Accessibility features |

**How it Works:**
When a PR modifies files, GitHub automatically requests review from the designated code owners.

---

## 📝 Pull Request Template

**File:** `PULL_REQUEST_TEMPLATE.md`

Comprehensive PR template with checklist covering:

### Pre-Submission Checklist
- ✅ Code Quality (style guide, JSDoc, naming)
- ✅ GPS & Data Validation (6 decimals)
- ✅ Security (no hardcoded keys)
- ✅ TA Lärm Compliance (official thresholds)
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Responsive Design (Mobile/Tablet/Desktop)
- ✅ Cross-Browser Testing
- ✅ Internationalization (DE/EN)
- ✅ Documentation

### Sections
1. Description & Related Issues
2. Type of Change
3. Pre-Submission Checklist (comprehensive)
4. Testing Performed
5. Screenshots
6. Additional Context

**Purpose:** Ensure all quality criteria are met before merge

---

## 🛠️ Linter Configurations

### ESLint (`.eslintrc.json`)

**Base:** Airbnb JavaScript Style Guide  
**Key Rules:**
- `no-console`: Warn (allow error/warn/info)
- `max-len`: 120 characters
- `prefer-const`: Error
- `no-var`: Error
- `prefer-template`: Error

### HTML Validate (`.htmlvalidate.json`)

**Base:** html-validate:recommended  
**Key Rules:**
- Semantic HTML enforcement
- ARIA attribute validation
- WCAG compliance checks
- No duplicate IDs

### Stylelint (`.stylelintrc.json`)

**Base:** stylelint-config-standard  
**Key Rules:**
- 2-space indentation
- Single quotes for strings
- Color hex lowercase and long format
- Tailwind CSS support

---

## 📚 How to Use This Configuration

### For Developers

1. **Read copilot-instructions.md** first to understand project standards
2. **Use specialized prompts** when working on specific tasks:
   - Code review? → `prompts/code-review.md`
   - New feature? → `prompts/feature-development.md`
   - Bug fix? → `prompts/bug-fix.md`
3. **Follow PR template** when creating pull requests
4. **Check workflow results** before requesting review

### For GitHub Copilot

GitHub Copilot automatically:
- Reads `copilot-instructions.md` for context
- Provides suggestions based on project standards
- Respects critical constraints (GPS precision, TA Lärm, security)

### For Code Reviews

1. Use `prompts/code-review.md` as checklist
2. Verify automated workflow results
3. Check PR template completion
4. Focus on:
   - Security (no hardcoded secrets)
   - Accessibility (WCAG 2.1 AA)
   - GPS precision (6 decimals)
   - TA Lärm compliance (official thresholds)

---

## 🔧 Maintenance

### Updating Instructions

When project standards change:
1. Update `copilot-instructions.md`
2. Update relevant prompts in `prompts/`
3. Update `PULL_REQUEST_TEMPLATE.md` if checklist changes
4. Test workflows still pass

### Adding New Prompts

To add a new specialized prompt:
1. Create `prompts/new-prompt.md`
2. Follow existing prompt structure
3. Reference in this README
4. Update copilot-instructions.md if needed

### Workflow Modifications

When modifying workflows:
1. Test locally with `act` (GitHub Actions local runner)
2. Update workflow documentation
3. Ensure all jobs have proper error handling

---

## ✅ Quality Gates

### Before Merging a PR

All these must pass:
- ✅ All GitHub Actions workflows successful
- ✅ Code review approved by code owner
- ✅ PR template checklist completed
- ✅ No unresolved conversations
- ✅ Branch up-to-date with target

### Required Checks

1. **Code Quality**: ESLint, HTML, CSS validation pass
2. **Security**: No secrets detected
3. **GPS Validation**: All coordinates 6 decimals
4. **Accessibility**: WCAG 2.1 AA compliant
5. **Documentation**: JSDoc completeness >80%

---

## 📖 References

### Official Sources
- [TA Lärm 1998](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

### Project Documents
- [AGENTS.md](../AGENTS.md) - Detailed development guidelines
- [README.md](../README.md) - User documentation

---

## 🎉 Success Metrics

This configuration helps achieve:
- ✅ **100% GPS Precision**: All coordinates validated to 6 decimals
- ✅ **WCAG 2.1 AA Compliance**: Automated accessibility testing
- ✅ **Zero Hardcoded Secrets**: Automated secret scanning
- ✅ **Consistent Code Quality**: Airbnb style guide enforcement
- ✅ **Comprehensive Documentation**: JSDoc completeness tracking
- ✅ **Regulatory Compliance**: TA Lärm validation

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-01  
**Maintainer:** @Darkness308  
**Project:** MORPHEUS LOGISTIK Dashboard
