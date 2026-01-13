# MORPHEUS Dashboard - Debugging Guide

**Last Updated:** 2026-01-13  
**Repository:** Darkness308/Live_Dashboard_Drohnen_Standort-Routenanalyse

---

## 🎯 Quick Start Debugging

### Check Build Status
```bash
# Lint all code
npm run lint

# Validate GPS coordinates
npm run validate:gps

# Check for secrets
npm run validate:secrets

# Run all validations
npm test
```

### Common Issues & Solutions

#### Issue 1: "Google Maps API not loaded"
**Symptom:** Map shows error message instead of rendering  
**Cause:** Missing or invalid API key

**Solution:**
1. Copy `.env.example` to `.env`
2. Add your Google Maps API key:
   ```
   GOOGLE_MAPS_API_KEY=your_actual_key_here
   ```
3. Configure domain restrictions in Google Cloud Console
4. Reload the page

---

#### Issue 2: "GPS Validation Failed"
**Symptom:** Console shows GPS coordinate errors  
**Cause:** Coordinates don't have exactly 6 decimal places

**Solution:**
```javascript
// ❌ WRONG: Wrong decimal places
const point = { lat: 51.371, lng: 7.693 };

// ✅ CORRECT: Exactly 6 decimal places
const point = { lat: 51.371099, lng: 7.693150 };
```

**Validation Rule:**
```javascript
function validateGpsCoordinates(lat, lng) {
  const latDecimals = (lat.toString().split('.')[1] || '').length;
  const lngDecimals = (lng.toString().split('.')[1] || '').length;
  return latDecimals === 6 && lngDecimals === 6;
}
```

---

#### Issue 3: "Leaflet is not defined"
**Symptom:** `ReferenceError: L is not defined`  
**Cause:** Script load order issue

**Solution:** Ensure scripts load in correct order:
```html
<!-- 1. External libraries first -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>

<!-- 2. Data files before logic -->
<script src="assets/data.js"></script>

<!-- 3. Logic files last -->
<script src="assets/maps.js"></script>
<script src="assets/charts.js"></script>
<script src="assets/leaflet-map.js"></script>
```

---

#### Issue 4: Charts Not Rendering
**Symptom:** Blank white boxes where charts should appear  
**Cause:** Chart.js not initialized or canvas element missing

**Debug Steps:**
1. Check if Chart.js is loaded:
   ```javascript
   console.log(typeof Chart); // Should be "function", not "undefined"
   ```

2. Check if canvas exists:
   ```javascript
   const canvas = document.getElementById('taLaermChart');
   console.log(canvas); // Should be HTMLCanvasElement, not null
   ```

3. Check for JavaScript errors in browser console (F12)

**Solution:**
```javascript
// Ensure DOM is ready before initializing charts
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded');
    return;
  }
  initCharts();
});
```

---

## 🔍 ESLint Issues Resolution

### Current Status (After Auto-Fix)
```
Total Issues:   102 (down from 1,765)
Errors:         75
Warnings:       27
Auto-fixed:     1,663 issues (94% reduction)
```

### Remaining Critical Issues

#### 1. Line Length Violations (15 instances)
**Rule:** `max-len` (120 characters)

**Example:**
```javascript
// ❌ WRONG: Line too long (363 characters)
const mapOptions = { center: options.center || ISERLOHN_CENTER, zoom: options.zoom ?? 17, mapTypeId: google.maps.MapTypeId.SATELLITE, tilt: 45, heading: 0, mapId: config.mapId || undefined, fullscreenControl: true, zoomControl: true, rotateControl: true, streetViewControl: false };

// ✅ CORRECT: Break into multiple lines
const mapOptions = {
  center: options.center || ISERLOHN_CENTER,
  zoom: options.zoom ?? 17,
  mapTypeId: google.maps.MapTypeId.SATELLITE,
  tilt: 45,
  heading: 0,
  mapId: config.mapId || undefined,
  fullscreenControl: true,
  zoomControl: true,
  rotateControl: true,
  streetViewControl: false,
};
```

---

#### 2. Nested Ternary Operators (10 instances)
**Rule:** `no-nested-ternary`

**Example:**
```javascript
// ❌ WRONG: Nested ternaries are hard to read
const color = level >= 3 ? 'red' : level === 2 ? 'orange' : 'blue';

// ✅ CORRECT: Use if-else or lookup object
function getColorByLevel(level) {
  if (level >= 3) return 'red';
  if (level === 2) return 'orange';
  return 'blue';
}

// OR use object lookup
const COLOR_MAP = {
  3: 'red',
  2: 'orange',
  1: 'blue',
};
const color = COLOR_MAP[level] || 'blue';
```

---

#### 3. Unused Variables (8 instances)
**Rule:** `no-unused-vars`

**Files with unused vars:**
- `assets/google-maps-3d.js` - `noisePolygons` (line 6)
- `assets/leaflet-map.js` - `terrainEnabled` (line 10)
- `assets/performance.js` - `visibilityObserver` (line 51), `navigation` (line 521)
- `assets/fleet-dashboard.js` - `index` parameter (line 516)

**Solutions:**

Option 1: Remove unused variable
```javascript
// ❌ WRONG: Variable declared but never used
const terrainEnabled = false;

// ✅ CORRECT: Simply remove it
// (nothing to add - just delete the line)
```

Option 2: Prefix with underscore if intentionally unused
```javascript
// ✅ CORRECT: Mark as intentionally unused
const _terrainEnabled = false; // Reserved for future terrain feature

// OR for function parameters
array.map((_value, index) => index); // _value unused but required by signature
```

---

#### 4. Console Statements (27 warnings)
**Rule:** `no-console`

**Current:**
```javascript
console.log('Debug info'); // ⚠️ Warning in production
```

**Solutions:**

Option 1: Use console.error/warn for important messages
```javascript
console.error('❌ Critical error'); // ✅ Allowed
console.warn('⚠️ Warning');        // ✅ Allowed
```

Option 2: Wrap in development check
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info'); // ✅ Only in dev
}
```

Option 3: Use proper logging library
```javascript
import logger from './utils/logger.js';
logger.debug('Debug info'); // ✅ Configurable log levels
```

Option 4: Disable specific lines (use sparingly)
```javascript
// eslint-disable-next-line no-console
console.log('This is intentional');
```

---

#### 5. Dangling Underscores (13 instances)
**Rule:** `no-underscore-dangle`

**Files:** `assets/google-maps-3d.js`

**Current:**
```javascript
map.__noiseDataLayer = noiseData; // ❌ Dangling underscore
polyline.__meta = { id, name };    // ❌ Dangling underscore
```

**Solutions:**

Option 1: Use WeakMap (recommended)
```javascript
const noiseDataLayers = new WeakMap();
noiseDataLayers.set(map, noiseData); // ✅ No dangling underscore

const polylineMeta = new WeakMap();
polylineMeta.set(polyline, { id, name }); // ✅ Better encapsulation
```

Option 2: Use Symbol
```javascript
const NOISE_DATA_LAYER = Symbol('noiseDataLayer');
map[NOISE_DATA_LAYER] = noiseData; // ✅ True private property
```

Option 3: Refactor to module scope
```javascript
// Module-level storage
const mapNoiseDataLayers = {};
const polylineMetadata = {};

// Store with unique key
mapNoiseDataLayers[mapId] = noiseData;
polylineMetadata[polylineId] = { id, name };
```

---

#### 6. `var` Usage (2 instances)
**Rule:** `no-var`  
**Files:** `assets/google-maps-3d.js`

**Current:**
```javascript
var MORPHEUS_GMAPS = (function() { // ❌ Use const
  // ...
})();
```

**Fix:**
```javascript
const MORPHEUS_GMAPS = (() => { // ✅ Use const
  // ...
})();
```

---

#### 7. Promise Executor Return (2 instances)
**Rule:** `no-promise-executor-return`

**Current:**
```javascript
return new Promise((resolve, reject) => {
  if (condition) return resolve(); // ❌ Don't return in executor
});
```

**Fix:**
```javascript
return new Promise((resolve, reject) => {
  if (condition) {
    resolve(); // ✅ Just call, don't return
    return;    // ✅ Early exit
  }
});
```

---

## 🐛 Runtime Debugging

### Enable Debug Mode
```javascript
// Add to your HTML <head>
<script>
  window.MORPHEUS_DEBUG = true;
  window.MORPHEUS_LOG_LEVEL = 'debug'; // 'error' | 'warn' | 'info' | 'debug'
</script>
```

### Browser DevTools Checklist

#### Step 1: Open DevTools (F12)
- Chrome: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- Firefox: F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- Safari: Cmd+Option+I (enable Developer menu first)
- Edge: F12 or Ctrl+Shift+I

#### Step 2: Check Console Tab
Look for:
- ❌ Red errors (must fix)
- ⚠️ Yellow warnings (should fix)
- 🔵 Blue info messages (informational)

Common error patterns:
```
ReferenceError: X is not defined     → Script load order issue
TypeError: Cannot read property 'X'  → Object is null/undefined
SyntaxError: Unexpected token        → JavaScript syntax error
Failed to fetch                      → Network/CORS issue
```

#### Step 3: Check Network Tab
Verify all resources load successfully:
- ✅ Status 200 = OK
- ⚠️ Status 304 = Cached (OK)
- ❌ Status 404 = Not found
- ❌ Status 403 = Forbidden
- ❌ Status 500 = Server error

Filter by:
- JS = JavaScript files
- CSS = Stylesheets
- XHR = API calls
- All = Everything

#### Step 4: Check Sources/Debugger Tab
Set breakpoints to pause execution:
1. Click line number to set breakpoint
2. Refresh page
3. Code pauses at breakpoint
4. Inspect variables in Scope panel
5. Step through code with controls

---

## 🔐 Security Debugging

### Check for Exposed Secrets
```bash
# Scan for hardcoded secrets
grep -r "AIzaSy" . --include="*.js" --include="*.html"

# Should output: (nothing found)
```

### Test XSS Vulnerability
```javascript
// Try injecting script in input fields
const testInput = '<script>alert("XSS")</script>';

// ❌ VULNERABLE: Direct innerHTML
element.innerHTML = testInput; // Shows alert!

// ✅ SAFE: Sanitized
element.textContent = testInput; // Shows as text
// OR
element.innerHTML = DOMPurify.sanitize(testInput);
```

### Check CORS Issues
```javascript
// In browser console
fetch('https://api.example.com/data')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('CORS error:', err));
```

If CORS error occurs:
1. Backend must send `Access-Control-Allow-Origin` header
2. OR use proxy server
3. OR enable CORS in development (NOT for production)

---

## 📱 Mobile/Responsive Debugging

### Test Responsive Design
**Chrome DevTools:**
1. Press F12
2. Click device toggle icon (top-left)
3. Select device: iPhone 12, iPad, etc.
4. Test different screen sizes

**Firefox Responsive Mode:**
1. Press F12
2. Click responsive design mode (Ctrl+Shift+M)
3. Test different viewports

### Breakpoints to Test
- **320px** - Mobile portrait (iPhone SE)
- **375px** - Mobile portrait (iPhone 12)
- **768px** - Tablet portrait (iPad)
- **1024px** - Tablet landscape / Small desktop
- **1440px** - Desktop
- **1920px** - Large desktop

### Touch Event Debugging
```javascript
// Test touch vs mouse events
element.addEventListener('touchstart', (e) => {
  console.log('Touch detected');
  e.preventDefault(); // Prevent mouse events
});

element.addEventListener('click', (e) => {
  console.log('Click detected');
});
```

---

## ♿ Accessibility Debugging

### Screen Reader Testing
**NVDA (Windows - Free):**
1. Download from https://www.nvaccess.org/
2. Install and launch
3. Navigate with Tab key
4. Listen to announcements

**VoiceOver (Mac - Built-in):**
1. Press Cmd+F5 to toggle
2. Navigate with VO keys (Ctrl+Option + arrows)
3. Listen to announcements

**Expected Behavior:**
- All interactive elements announced
- Images have alt text
- Headings in correct order (h1 → h2 → h3)
- Form labels associated with inputs
- Dynamic content changes announced

### Keyboard Navigation Testing
**Test without mouse:**
1. Refresh page
2. Press Tab to navigate
3. Press Enter/Space to activate
4. Press Shift+Tab to go back
5. Press Esc to close dialogs

**Requirements:**
- ✅ Visible focus indicator (outline)
- ✅ Logical tab order
- ✅ Skip to main content link works
- ✅ All interactive elements reachable
- ✅ No keyboard traps

### Color Contrast Checker
```bash
# Use browser extension
# Chrome: "WAVE" or "axe DevTools"
# Firefox: "WAVE" or "axe DevTools"
```

**WCAG 2.1 AA Requirements:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

---

## 🧪 Testing Checklist

### Before Committing
- [ ] Run `npm run lint` - All pass
- [ ] Run `npm run validate` - All pass
- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (if on Mac)
- [ ] Test in Edge (if on Windows)
- [ ] Test on mobile device (actual or emulator)
- [ ] Test keyboard navigation (Tab, Enter, Esc)
- [ ] Test with screen reader (NVDA or VoiceOver)
- [ ] Check browser console for errors (should be 0)
- [ ] Check Network tab for failed requests (should be 0)
- [ ] Visual regression test (compare screenshots)

### Before Deploying
- [ ] All tests pass
- [ ] No hardcoded secrets
- [ ] API keys in environment variables
- [ ] CORS configured correctly
- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Performance monitoring enabled
- [ ] Backup & rollback plan ready

---

## 📊 Performance Debugging

### Measure Page Load Time
```javascript
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
  console.log('DOM ready:', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
});
```

### Lighthouse Audit
**Chrome DevTools:**
1. F12 → Lighthouse tab
2. Click "Generate report"
3. Review scores:
   - Performance: >90
   - Accessibility: 100
   - Best Practices: >90
   - SEO: >90

### Common Performance Issues

**Issue: Large bundle size**
```bash
# Check bundle size
ls -lh assets/*.js

# Solution: Code splitting, lazy loading
<script src="assets/data.js" defer></script>
<script src="assets/maps.js" defer></script>
```

**Issue: Unoptimized images**
```bash
# Check image sizes
ls -lh *.png *.jpg

# Solution: Use WebP format, compress images
convert image.jpg -quality 85 image.webp
```

**Issue: Too many HTTP requests**
```
# Solution: Bundle files, use CDN
```

---

## 🆘 Getting Help

### Internal Resources
- **CODE_REVIEW_REPORT.md** - Comprehensive code review findings
- **AGENTS.md** - Development guidelines by domain
- **README.md** - Setup and usage instructions

### External Resources
- **ESLint Docs:** https://eslint.org/docs/latest/rules/
- **WCAG 2.1 Quick Reference:** https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Web Docs:** https://developer.mozilla.org/
- **Stack Overflow:** https://stackoverflow.com/

### Reporting Issues
When reporting bugs, include:
1. Browser & version (Chrome 120, Firefox 121, etc.)
2. Operating system (Windows 11, macOS 14, etc.)
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Screenshots/screen recording
7. Browser console errors (F12 → Console)
8. Network requests (F12 → Network)

**Example Bug Report:**
```markdown
**Browser:** Chrome 120.0.6099.109 (Windows 11)
**Issue:** Map not rendering

**Steps to Reproduce:**
1. Open index.html in browser
2. Wait 5 seconds

**Expected:** Interactive map displays
**Actual:** Blank white box with loading spinner

**Console Errors:**
```
ReferenceError: google is not defined at initMap (maps.js:15)
```

**Network:** All requests return 200 OK

**Screenshot:** (attached)
```

---

## 🎯 Summary

### Quick Debugging Steps
1. **Check browser console** (F12) for errors
2. **Verify script load order** in HTML
3. **Test with clean browser cache** (Ctrl+Shift+Del)
4. **Check API keys** are configured
5. **Run linters** (`npm run lint`)
6. **Test in incognito mode** (rules out extension conflicts)
7. **Check Network tab** for failed requests
8. **Use debugger breakpoints** to step through code

### Most Common Issues
1. Script load order (fix in HTML)
2. Missing API keys (add to .env)
3. GPS coordinate precision (6 decimals required)
4. Console errors (check F12)
5. Accessibility issues (test with keyboard/screen reader)

---

**Last Updated:** 2026-01-13  
**Maintainer:** @Darkness308  
**Status:** 🟢 Active Development
