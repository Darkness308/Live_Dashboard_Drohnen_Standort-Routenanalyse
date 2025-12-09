/**
 * assets/performance.js
 *
 * MORPHEUS Dashboard - Performance & Sustainable UX Module
 * =========================================================
 *
 * Features:
 * - Lazy Loading fuer Karten-Layer und Bilder
 * - IntersectionObserver fuer Viewport-basiertes Laden
 * - Resource Hints (preconnect, prefetch)
 * - Idle-Callback Scheduling
 * - Memory-effizientes Cleanup
 * - Reduced Motion Detection
 * - Network-aware Loading
 * - Energy-efficient Animations
 *
 * @module MORPHEUS_PERF
 * @version 1.0.0
 */

var MORPHEUS_PERF = (function () {
  'use strict';

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  const CONFIG = {
    // IntersectionObserver Thresholds
    lazyLoadThreshold: 0.1,
    lazyLoadRootMargin: '200px',

    // Debounce/Throttle Zeiten
    scrollDebounce: 100,
    resizeDebounce: 250,

    // Idle Callback Timeout
    idleTimeout: 2000,

    // Prefetch Limits
    maxPrefetchCount: 5,

    // Animation Settings
    reducedMotionDuration: 0,
    normalDuration: 300
  };

  // ===========================================================================
  // STATE
  // ===========================================================================

  let lazyLoadObserver = null;
  let visibilityObserver = null;
  const loadedResources = new Set();
  let prefetchCount = 0;

  // ===========================================================================
  // FEATURE DETECTION
  // ===========================================================================

  const features = {
    intersectionObserver: 'IntersectionObserver' in window,
    requestIdleCallback: 'requestIdleCallback' in window,
    connection: 'connection' in navigator,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    saveData: navigator.connection?.saveData || false
  };

  /**
   * Prueft ob Benutzer Reduced Motion bevorzugt
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return features.reducedMotion;
  }

  /**
   * Prueft ob Benutzer Data Saver aktiviert hat
   * @returns {boolean}
   */
  function isDataSaverEnabled() {
    return features.saveData;
  }

  /**
   * Gibt aktuelle Verbindungsgeschwindigkeit zurueck
   * @returns {string} '4g', '3g', '2g', 'slow-2g', oder 'unknown'
   */
  function getConnectionType() {
    return navigator.connection?.effectiveType || 'unknown';
  }

  // ===========================================================================
  // LAZY LOADING
  // ===========================================================================

  /**
   * Initialisiert Lazy Loading fuer Elemente mit data-lazy Attribut
   *
   * @example
   * <img data-lazy="src" data-src="/images/map.png" alt="Map">
   * <div data-lazy="component" data-component="noise-chart"></div>
   */
  function initLazyLoading() {
    if (!features.intersectionObserver) {
      // Fallback: Alles sofort laden
      loadAllLazyElements();
      return;
    }

    lazyLoadObserver = new IntersectionObserver(handleLazyIntersection, {
      root: null,
      rootMargin: CONFIG.lazyLoadRootMargin,
      threshold: CONFIG.lazyLoadThreshold
    });

    // Alle lazy Elemente observieren
    document.querySelectorAll('[data-lazy]').forEach(el => {
      lazyLoadObserver.observe(el);
    });

    console.log('[PERF] Lazy loading initialized');
  }

  /**
   * IntersectionObserver Callback
   */
  function handleLazyIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        loadLazyElement(el);
        lazyLoadObserver.unobserve(el);
      }
    });
  }

  /**
   * Laedt ein einzelnes lazy Element
   */
  function loadLazyElement(el) {
    const lazyType = el.dataset.lazy;

    switch (lazyType) {
      case 'src':
        // Bild/Video Lazy Loading
        if (el.dataset.src) {
          el.src = el.dataset.src;
          delete el.dataset.src;
        }
        if (el.dataset.srcset) {
          el.srcset = el.dataset.srcset;
          delete el.dataset.srcset;
        }
        break;

      case 'background':
        // Background Image Lazy Loading
        if (el.dataset.bg) {
          el.style.backgroundImage = `url(${el.dataset.bg})`;
          delete el.dataset.bg;
        }
        break;

      case 'component':
        // Component Lazy Loading
        loadLazyComponent(el);
        break;

      case 'iframe':
        // Iframe Lazy Loading
        if (el.dataset.iframeSrc) {
          el.src = el.dataset.iframeSrc;
          delete el.dataset.iframeSrc;
        }
        break;

      case 'map-layer':
        // Karten-Layer Lazy Loading
        loadMapLayer(el);
        break;
    }

    el.classList.add('lazy-loaded');
    el.removeAttribute('data-lazy');
  }

  /**
   * Laedt eine lazy Komponente
   */
  function loadLazyComponent(el) {
    const componentName = el.dataset.component;
    if (!componentName) return;

    // Event dispatchen fuer externe Handler
    const event = new CustomEvent('lazyComponentLoad', {
      detail: { element: el, component: componentName }
    });
    document.dispatchEvent(event);

    console.log(`[PERF] Lazy component loaded: ${componentName}`);
  }

  /**
   * Laedt einen Karten-Layer lazy
   */
  function loadMapLayer(el) {
    const layerType = el.dataset.layerType;
    const layerUrl = el.dataset.layerUrl;

    if (layerType && layerUrl) {
      const event = new CustomEvent('lazyMapLayerLoad', {
        detail: { element: el, type: layerType, url: layerUrl }
      });
      document.dispatchEvent(event);
    }
  }

  /**
   * Fallback: Laedt alle lazy Elemente sofort
   */
  function loadAllLazyElements() {
    document.querySelectorAll('[data-lazy]').forEach(loadLazyElement);
  }

  // ===========================================================================
  // RESOURCE HINTS
  // ===========================================================================

  /**
   * Fuegt Resource Hints zum Document Head hinzu
   *
   * @param {string} url - Die URL
   * @param {string} type - 'preconnect', 'prefetch', 'preload', 'dns-prefetch'
   * @param {Object} [options] - Zusaetzliche Optionen
   */
  function addResourceHint(url, type, options = {}) {
    // Duplikate vermeiden
    const key = `${type}:${url}`;
    if (loadedResources.has(key)) return;

    // Data Saver Mode: Nur kritische Hints
    if (isDataSaverEnabled() && type === 'prefetch') return;

    const link = document.createElement('link');
    link.rel = type;
    link.href = url;

    if (options.as) link.as = options.as;
    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
    if (options.type) link.type = options.type;

    document.head.appendChild(link);
    loadedResources.add(key);

    console.log(`[PERF] Resource hint added: ${type} ${url}`);
  }

  /**
   * Fuegt kritische Preconnects hinzu
   */
  function addCriticalPreconnects() {
    const criticalOrigins = [
      'https://unpkg.com',           // Leaflet
      'https://cdn.jsdelivr.net',    // Chart.js
      'https://cdn.tailwindcss.com', // Tailwind
      'https://cesium.com'           // CesiumJS
    ];

    criticalOrigins.forEach(origin => {
      addResourceHint(origin, 'preconnect', { crossOrigin: 'anonymous' });
      addResourceHint(origin, 'dns-prefetch');
    });
  }

  /**
   * Prefetcht eine Ressource im Idle
   */
  function prefetchInIdle(url, options = {}) {
    if (prefetchCount >= CONFIG.maxPrefetchCount) return;
    if (isDataSaverEnabled()) return;

    scheduleIdleTask(() => {
      addResourceHint(url, 'prefetch', options);
      prefetchCount++;
    });
  }

  // ===========================================================================
  // IDLE SCHEDULING
  // ===========================================================================

  /**
   * Plant eine Aufgabe fuer Idle-Zeit
   *
   * @param {Function} callback - Die auszufuehrende Funktion
   * @param {number} [timeout] - Maximale Wartezeit
   */
  function scheduleIdleTask(callback, timeout = CONFIG.idleTimeout) {
    if (features.requestIdleCallback) {
      requestIdleCallback(callback, { timeout });
    } else {
      // Fallback mit setTimeout
      setTimeout(callback, 50);
    }
  }

  /**
   * Fuehrt mehrere Aufgaben sequentiell in Idle-Zeit aus
   *
   * @param {Array<Function>} tasks - Array von Funktionen
   */
  function scheduleIdleTasks(tasks) {
    let index = 0;

    function runNext(deadline) {
      while (index < tasks.length && (deadline?.timeRemaining() > 0 || !features.requestIdleCallback)) {
        tasks[index]();
        index++;
      }

      if (index < tasks.length) {
        scheduleIdleTask(runNext);
      }
    }

    scheduleIdleTask(runNext);
  }

  // ===========================================================================
  // VISIBILITY-BASED OPTIMIZATION
  // ===========================================================================

  /**
   * Pausiert/Resumiert Animationen basierend auf Tab-Visibility
   */
  function initVisibilityOptimization() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseNonEssentialAnimations();
      } else {
        resumeAnimations();
      }
    });
  }

  /**
   * Pausiert nicht-essentielle Animationen
   */
  function pauseNonEssentialAnimations() {
    document.body.classList.add('animations-paused');

    // Event fuer externe Handler
    document.dispatchEvent(new CustomEvent('animationsPaused'));

    console.log('[PERF] Animations paused (tab hidden)');
  }

  /**
   * Setzt Animationen fort
   */
  function resumeAnimations() {
    document.body.classList.remove('animations-paused');

    // Event fuer externe Handler
    document.dispatchEvent(new CustomEvent('animationsResumed'));

    console.log('[PERF] Animations resumed');
  }

  // ===========================================================================
  // DEBOUNCE & THROTTLE UTILITIES
  // ===========================================================================

  /**
   * Debounce-Funktion
   *
   * @param {Function} func - Die zu debouncende Funktion
   * @param {number} wait - Wartezeit in ms
   * @returns {Function}
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle-Funktion
   *
   * @param {Function} func - Die zu throttlende Funktion
   * @param {number} limit - Minimaler Abstand in ms
   * @returns {Function}
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ===========================================================================
  // ANIMATION UTILITIES
  // ===========================================================================

  /**
   * Gibt die optimale Animationsdauer zurueck
   * Beruecksichtigt prefers-reduced-motion
   *
   * @param {number} normalDuration - Normale Dauer in ms
   * @returns {number}
   */
  function getAnimationDuration(normalDuration = CONFIG.normalDuration) {
    return prefersReducedMotion() ? CONFIG.reducedMotionDuration : normalDuration;
  }

  /**
   * Fuehrt Animation nur aus wenn erlaubt
   *
   * @param {HTMLElement} element - Das Element
   * @param {string} animationClass - CSS-Klasse fuer Animation
   * @param {number} duration - Dauer in ms
   * @returns {Promise}
   */
  function animateIfAllowed(element, animationClass, duration = 300) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }

      element.classList.add(animationClass);

      setTimeout(() => {
        element.classList.remove(animationClass);
        resolve();
      }, duration);
    });
  }

  // ===========================================================================
  // MEMORY MANAGEMENT
  // ===========================================================================

  /**
   * Bereinigt nicht mehr sichtbare Ressourcen
   */
  function cleanupOffscreenResources() {
    // Cleanup Event dispatchen
    document.dispatchEvent(new CustomEvent('performanceCleanup'));
  }

  /**
   * Gibt Speicher frei wenn moeglich
   */
  function requestMemoryCleanup() {
    // Garbage Collection Hint (nur Chrome)
    if (window.gc) {
      scheduleIdleTask(() => window.gc());
    }

    cleanupOffscreenResources();
  }

  // ===========================================================================
  // NETWORK OPTIMIZATION
  // ===========================================================================

  /**
   * Gibt empfohlene Bildqualitaet basierend auf Verbindung zurueck
   *
   * @returns {string} 'high', 'medium', 'low'
   */
  function getRecommendedImageQuality() {
    if (isDataSaverEnabled()) return 'low';

    const connectionType = getConnectionType();

    switch (connectionType) {
      case '4g':
        return 'high';
      case '3g':
        return 'medium';
      case '2g':
      case 'slow-2g':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Gibt empfohlene Map-Tile-Qualitaet zurueck
   *
   * @returns {number} Tile-Groesse (256 oder 512)
   */
  function getRecommendedTileSize() {
    const quality = getRecommendedImageQuality();
    return quality === 'low' ? 256 : 512;
  }

  // ===========================================================================
  // PERFORMANCE METRICS
  // ===========================================================================

  /**
   * Misst und loggt Performance-Metriken
   */
  function measurePerformance() {
    if (!window.performance) return null;

    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    const metrics = {
      // Navigation Timing
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.requestStart,
      domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
      windowLoad: timing.loadEventEnd - timing.navigationStart,

      // Resource Timing
      resourceCount: performance.getEntriesByType('resource').length,

      // Memory (Chrome only)
      memory: performance.memory ? {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null
    };

    console.log('[PERF] Performance Metrics:', metrics);
    return metrics;
  }

  /**
   * Markiert einen Performance-Zeitpunkt
   *
   * @param {string} name - Name des Markers
   */
  function mark(name) {
    if (performance.mark) {
      performance.mark(`morpheus_${name}`);
    }
  }

  /**
   * Misst Zeit zwischen zwei Markern
   *
   * @param {string} name - Name der Messung
   * @param {string} startMark - Start-Marker
   * @param {string} endMark - End-Marker
   */
  function measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(
          `morpheus_${name}`,
          `morpheus_${startMark}`,
          `morpheus_${endMark}`
        );
      } catch (e) {
        // Marker existieren nicht
      }
    }
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialisiert alle Performance-Optimierungen
   */
  function init() {
    console.log('[PERF] Initializing performance module...');
    console.log('[PERF] Features:', features);

    // Kritische Preconnects
    addCriticalPreconnects();

    // Lazy Loading
    initLazyLoading();

    // Visibility Optimization
    initVisibilityOptimization();

    // Memory Cleanup bei Low Memory
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      setInterval(requestMemoryCleanup, 60000); // Alle 60s
    }

    // Performance Metriken nach Load
    window.addEventListener('load', () => {
      scheduleIdleTask(measurePerformance);
    });

    console.log('[PERF] Performance module initialized');
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  return {
    // Initialization
    init,

    // Feature Detection
    prefersReducedMotion,
    isDataSaverEnabled,
    getConnectionType,
    features,

    // Lazy Loading
    initLazyLoading,
    loadLazyElement,

    // Resource Hints
    addResourceHint,
    prefetchInIdle,

    // Scheduling
    scheduleIdleTask,
    scheduleIdleTasks,

    // Utilities
    debounce,
    throttle,

    // Animation
    getAnimationDuration,
    animateIfAllowed,

    // Network
    getRecommendedImageQuality,
    getRecommendedTileSize,

    // Memory
    requestMemoryCleanup,

    // Metrics
    measurePerformance,
    mark,
    measure
  };

})();

// Auto-Init wenn DOM bereit
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MORPHEUS_PERF.init);
} else {
  MORPHEUS_PERF.init();
}

// Export fuer Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MORPHEUS_PERF;
}
