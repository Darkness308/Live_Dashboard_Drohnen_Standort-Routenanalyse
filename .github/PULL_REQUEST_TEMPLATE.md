## 📋 Pull Request Description

### What does this PR do?
<!-- Provide a clear and concise description of the changes -->

### Related Issues
<!-- Link to related issues: Fixes #123, Closes #456 -->

### Type of Change
<!-- Check the relevant boxes -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI change
- [ ] ♿ Accessibility improvement
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix

---

## ✅ Pre-Submission Checklist

### Code Quality
- [ ] Code follows **Airbnb JavaScript Style Guide**
- [ ] **JSDoc comments** added for all new functions
- [ ] No `console.log` statements (except for error handling)
- [ ] No dead code or commented-out code blocks
- [ ] Variable names are descriptive and follow camelCase convention
- [ ] Constants use UPPER_SNAKE_CASE convention

### GPS & Data Validation
- [ ] All GPS coordinates have **exactly 6 decimal places** (e.g., 51.371099, 7.693150)
- [ ] GPS coordinates are within valid range (lat: -90 to 90, lng: -180 to 180)
- [ ] GPS validation function used before rendering markers
- [ ] Route data validated before use

### Security
- [ ] **NO hardcoded API keys** in code
- [ ] API keys loaded from `.env` or environment variables
- [ ] `.env` file is in `.gitignore`
- [ ] `.env.example` updated with new variables (if applicable)
- [ ] No credentials or secrets in commit history

### TA Lärm Compliance (if applicable)
- [ ] **TA Lärm thresholds validated** against official sources
- [ ] Source links included in code comments
- [ ] Compliance calculations tested with valid test data
- [ ] Grenzwerte korrekt:
  - Wohngebiet Tag: 55 dB(A), Nacht: 40 dB(A)
  - Gewerbegebiet Tag: 65 dB(A), Nacht: 50 dB(A)
  - Industriegebiet: 70 dB(A) (Tag/Nacht)

### Accessibility (WCAG 2.1 AA)
- [ ] **Semantic HTML** used (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`)
- [ ] **ARIA labels** on all interactive elements
- [ ] **Keyboard navigation** tested and working (Tab, Enter, Space, ESC)
- [ ] **Focus indicators** visible and have sufficient contrast (≥3:1)
- [ ] **Screen reader** tested (NVDA, VoiceOver, or JAWS)
- [ ] **Color contrast** ratios sufficient:
  - Normal text: ≥4.5:1
  - Large text: ≥3:1
  - UI components: ≥3:1
- [ ] **Skip link** present ("Skip to main content")
- [ ] Text is resizable to 200% without loss of functionality

### Responsive Design
- [ ] **Mobile** (320px - 767px): Layout works correctly
- [ ] **Tablet** (768px - 1023px): Layout adapts properly
- [ ] **Desktop** (1024px+): Optimal display
- [ ] Touch targets are at least 44x44 pixels
- [ ] No horizontal scrolling at any viewport size

### Cross-Browser Testing
- [ ] **Chrome 100+** (Desktop): Tested and working
- [ ] **Firefox 100+** (Desktop): Tested and working
- [ ] **Safari 15+** (Desktop/iOS): Tested and working
- [ ] **Edge 90+** (Desktop): Tested and working
- [ ] No browser-specific CSS/JS without fallbacks

### Google Maps Integration (if applicable)
- [ ] Maps API script loads correctly
- [ ] Error handling for API load failures
- [ ] Map initializes at correct center (Iserlohn: 51.371099, 7.693150)
- [ ] Routes render correctly on map
- [ ] Markers display at correct GPS positions
- [ ] Info windows show correct data
- [ ] Heatmap works (if modified)
- [ ] No console errors related to Maps API

### Charts & Visualizations (if applicable)
- [ ] Chart.js loads correctly
- [ ] Charts display data accurately
- [ ] Charts are responsive
- [ ] Chart tooltips are accessible
- [ ] Charts have descriptive titles and labels
- [ ] Color-blind friendly color schemes used

### Internationalization
- [ ] **German (DE)** translations updated
- [ ] **English (EN)** translations updated
- [ ] Language toggle works correctly
- [ ] All UI text is translatable (no hardcoded strings)

### Testing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error scenarios handled gracefully
- [ ] No regression of existing features

### Documentation
- [ ] **README.md** updated (if necessary)
- [ ] **AGENTS.md** updated (if structural changes)
- [ ] Code comments explain "why" not just "what"
- [ ] Complex algorithms documented
- [ ] Regulatory references cited (for TA Lärm changes)

### Performance
- [ ] No performance regressions
- [ ] Images optimized (if added)
- [ ] Scripts defer/async where appropriate
- [ ] Event listeners debounced/throttled (if applicable)
- [ ] No memory leaks

---

## 🧪 Testing Performed

### Manual Testing
<!-- Describe the manual tests you performed -->
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on Safari/Edge
- [ ] Tested on Mobile device
- [ ] Keyboard navigation verified
- [ ] Screen reader testing (specify tool): ___________

### Automated Testing
<!-- Check if automated tests pass -->
- [ ] ESLint: No errors
- [ ] HTML Validation: Passed
- [ ] GPS Validation: All coordinates valid
- [ ] No secrets detected
- [ ] Accessibility checks: Passed

---

## 📸 Screenshots (if applicable)

### Before
<!-- Add screenshot of old behavior/UI -->

### After
<!-- Add screenshot of new behavior/UI -->

### Responsive Views
<!-- Add screenshots at different breakpoints if UI changed -->

---

## 🔗 Additional Context

### Dependencies
<!-- List any new dependencies added -->
- None / [List dependencies]

### Breaking Changes
<!-- Describe any breaking changes and migration steps -->
- None / [Describe changes]

### Deployment Notes
<!-- Any special deployment instructions or considerations -->
- None / [Deployment notes]

---

## 📚 References

<!-- Link to relevant documentation, issues, or discussions -->
- [TA Lärm 1998](https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google Maps API Docs](https://developers.google.com/maps/documentation/javascript)
- [AGENTS.md](../AGENTS.md)

---

## ✍️ Reviewer Notes

<!-- For reviewers: Add your comments, questions, or concerns here -->

### Review Focus Areas
- [ ] Security: No exposed secrets or API keys
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] GPS Precision: All coordinates have 6 decimals
- [ ] TA Lärm Compliance: Calculations correct (if applicable)
- [ ] Code Quality: Follows style guide
- [ ] Documentation: Adequate and accurate

---

**By submitting this PR, I confirm that:**
- ✅ I have tested my changes thoroughly
- ✅ My code follows the project's coding standards
- ✅ I have updated documentation where necessary
- ✅ My changes do not introduce security vulnerabilities
- ✅ I have addressed all items in the checklist above

---

<!-- 
Template Version: 1.0.0
Last Updated: 2025-12-01
Project: MORPHEUS Dashboard
-->
