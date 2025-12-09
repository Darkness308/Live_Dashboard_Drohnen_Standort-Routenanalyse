/**
 * assets/api-client.js
 *
 * MORPHEUS Dashboard - API Client Library
 * ========================================
 * Zentrale Abstraktion für alle Backend-Kommunikation.
 *
 * Features:
 * - REST API Calls (Routes, Noise Calculation, Config)
 * - WebSocket Connection für Live Drone Tracking
 * - Automatisches Retry mit Exponential Backoff
 * - Request Caching für Performance
 * - Error Handling mit strukturierten Fehlern
 *
 * @module MORPHEUS_API
 * @version 1.0.0
 * @author MORPHEUS Team
 *
 * @example
 * // REST API
 * const routes = await MORPHEUS_API.fetchRoutes();
 * const result = await MORPHEUS_API.calculateNoise({ route, settings });
 *
 * // WebSocket
 * const ws = MORPHEUS_API.connectWs((data) => console.log(data));
 * ws.send({ type: 'subscribe', droneId: 'drone-001' });
 */

/**
 * @typedef {Object} Point
 * @property {number} lat - Latitude (WGS84)
 * @property {number} lng - Longitude (WGS84)
 * @property {number} [alt] - Altitude in meters (optional)
 */

/**
 * @typedef {Object} Route
 * @property {string} id - Unique route identifier
 * @property {string} name - Human-readable route name
 * @property {Point[]} points - Array of route waypoints
 * @property {number} [distance] - Total distance in km
 * @property {number} [duration] - Estimated duration in minutes
 */

/**
 * @typedef {Object} NoiseCalculationRequest
 * @property {Route} route - Route to calculate noise for
 * @property {Object} [settings] - Calculation settings
 * @property {string} [settings.method='ISO9613-2'] - Calculation method
 * @property {number} [settings.receiverHeight=4] - Receiver height in meters
 */

/**
 * @typedef {Object} NoiseCalculationResult
 * @property {number} maxLevel - Maximum noise level in dB(A)
 * @property {number} avgLevel - Average noise level in dB(A)
 * @property {boolean} compliant - TA-Lärm compliance status
 * @property {Object[]} immissionsorte - Per-location results
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {number} status - HTTP status code
 * @property {string} code - Error code
 * @property {Object} [details] - Additional error details
 */

const MORPHEUS_API = (function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  const CONFIG = {
    basePath: '',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheEnabled: true,
    cacheTTL: 60000, // 1 minute
  };

  // Simple in-memory cache
  const cache = new Map();

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a structured API error
   * @param {string} message
   * @param {number} status
   * @param {string} code
   * @param {Object} [details]
   * @returns {ApiError}
   */
  function createError(message, status, code, details = null) {
    const error = new Error(message);
    error.name = 'ApiError';
    error.status = status;
    error.code = code;
    if (details) error.details = details;
    return error;
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate cache key from URL and options
   * @param {string} url
   * @param {RequestInit} opts
   * @returns {string}
   */
  function getCacheKey(url, opts = {}) {
    return `${opts.method || 'GET'}:${url}:${opts.body || ''}`;
  }

  /**
   * Check if cached response is still valid
   * @param {string} key
   * @returns {any|null}
   */
  function getFromCache(key) {
    if (!CONFIG.cacheEnabled) return null;
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Store response in cache
   * @param {string} key
   * @param {any} data
   */
  function setCache(key, data) {
    if (!CONFIG.cacheEnabled) return;
    cache.set(key, {
      data,
      expires: Date.now() + CONFIG.cacheTTL,
    });
  }

  /**
   * Clear all cached data
   */
  function clearCache() {
    cache.clear();
  }

  /**
   * Internal fetch with timeout, retry, and error handling
   * @param {string} url
   * @param {RequestInit} [opts={}]
   * @param {Object} [fetchOpts={}]
   * @param {boolean} [fetchOpts.useCache=true]
   * @param {number} [fetchOpts.retries]
   * @returns {Promise<any>}
   */
  async function _fetchJson(url, opts = {}, fetchOpts = {}) {
    const { useCache = true, retries = CONFIG.retryAttempts } = fetchOpts;
    const cacheKey = getCacheKey(url, opts);

    // Check cache for GET requests
    if ((!opts.method || opts.method === 'GET') && useCache) {
      const cached = getFromCache(cacheKey);
      if (cached !== null) {
        console.debug('[API] Cache hit:', url);
        return cached;
      }
    }

    // Add timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    const fetchOpt = {
      ...opts,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...opts.headers,
      },
    };

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.debug(`[API] Request (attempt ${attempt}/${retries}):`, url);

        const res = await fetch(url, fetchOpt);
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (!res.ok) {
          const body = isJson
            ? await res.json().catch(() => ({}))
            : await res.text().catch(() => '');

          throw createError(
            `Request failed: ${res.status} ${res.statusText}`,
            res.status,
            body.code || 'REQUEST_FAILED',
            body
          );
        }

        const data = isJson ? await res.json() : await res.text();

        // Cache successful GET responses
        if ((!opts.method || opts.method === 'GET') && useCache) {
          setCache(cacheKey, data);
        }

        return data;

      } catch (err) {
        lastError = err;

        // Don't retry on client errors (4xx)
        if (err.status && err.status >= 400 && err.status < 500) {
          throw err;
        }

        // Don't retry if aborted
        if (err.name === 'AbortError') {
          throw createError('Request timeout', 408, 'TIMEOUT');
        }

        // Retry with exponential backoff
        if (attempt < retries) {
          const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1);
          console.warn(`[API] Retry in ${delay}ms...`, err.message);
          await sleep(delay);
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError || createError('Request failed after retries', 500, 'MAX_RETRIES');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/routes
   * Fetch all available drone routes
   *
   * @returns {Promise<Route[]>}
   * @throws {ApiError}
   *
   * @example
   * const routes = await MORPHEUS_API.fetchRoutes();
   * routes.forEach(r => console.log(r.name, r.distance));
   */
  async function fetchRoutes() {
    return _fetchJson(CONFIG.basePath + '/api/routes');
  }

  /**
   * GET /api/routes/:id
   * Fetch a specific route by ID
   *
   * @param {string} routeId - Route identifier
   * @returns {Promise<Route>}
   * @throws {ApiError}
   */
  async function fetchRoute(routeId) {
    if (!routeId) throw createError('Route ID required', 400, 'INVALID_PARAM');
    return _fetchJson(`${CONFIG.basePath}/api/routes/${encodeURIComponent(routeId)}`);
  }

  /**
   * POST /api/noise/calculate
   * Calculate noise levels for a given route
   *
   * @param {NoiseCalculationRequest} payload - Calculation request
   * @returns {Promise<NoiseCalculationResult>}
   * @throws {ApiError}
   *
   * @example
   * const result = await MORPHEUS_API.calculateNoise({
   *   route: { id: 'route-a', points: [...] },
   *   settings: { method: 'ISO9613-2', receiverHeight: 4 }
   * });
   * console.log('Max level:', result.maxLevel, 'dB(A)');
   */
  async function calculateNoise(payload) {
    if (!payload || !payload.route) {
      throw createError('Route data required', 400, 'INVALID_PARAM');
    }

    return _fetchJson(CONFIG.basePath + '/api/noise/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, { useCache: false });
  }

  /**
   * GET /api/immissionsorte
   * Fetch all measurement points (Immissionsorte)
   *
   * @returns {Promise<Object[]>}
   * @throws {ApiError}
   */
  async function fetchImmissionsorte() {
    return _fetchJson(CONFIG.basePath + '/api/immissionsorte');
  }

  /**
   * GET /api/drones
   * Fetch all registered drones
   *
   * @returns {Promise<Object[]>}
   * @throws {ApiError}
   */
  async function fetchDrones() {
    return _fetchJson(CONFIG.basePath + '/api/drones');
  }

  /**
   * GET /api/config
   * Fetch frontend configuration (map keys, feature flags, etc.)
   *
   * @returns {Promise<{apiKey?: string, mapId?: string, features?: Object}>}
   * @throws {ApiError}
   */
  async function fetchConfig() {
    return _fetchJson(CONFIG.basePath + '/api/config');
  }

  /**
   * GET /api/health
   * Check backend health status
   *
   * @returns {Promise<{status: string, version: string, timestamp: string}>}
   * @throws {ApiError}
   */
  async function healthCheck() {
    return _fetchJson(CONFIG.basePath + '/api/health', {}, { useCache: false });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBSOCKET CONNECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * @typedef {Object} WebSocketConnection
   * @property {function(any): void} send - Send message to server
   * @property {function(): void} close - Close connection
   * @property {WebSocket} socket - Raw WebSocket instance
   * @property {function(): boolean} isConnected - Check connection status
   */

  /**
   * Connect to WebSocket for real-time drone position updates
   *
   * @param {function(any): void} onMessage - Message handler
   * @param {function(Event): void} [onOpen] - Connection opened handler
   * @param {function(CloseEvent): void} [onClose] - Connection closed handler
   * @param {function(Event): void} [onError] - Error handler
   * @returns {WebSocketConnection}
   *
   * @example
   * const ws = MORPHEUS_API.connectWs(
   *   (data) => {
   *     if (data.type === 'position') {
   *       updateDroneMarker(data.droneId, data.lat, data.lng);
   *     }
   *   },
   *   () => console.log('Connected'),
   *   () => console.log('Disconnected')
   * );
   *
   * // Subscribe to specific drone
   * ws.send({ type: 'subscribe', droneId: 'drone-001' });
   *
   * // Cleanup
   * ws.close();
   */
  function connectWs(onMessage, onOpen, onClose, onError) {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.host;
    const path = CONFIG.basePath + '/ws/drone-position';
    const wsUrl = `${protocol}://${host}${path}`;

    console.debug('[WS] Connecting to:', wsUrl);

    const socket = new WebSocket(wsUrl);
    let reconnectAttempts = 0;
    const maxReconnects = 5;

    socket.addEventListener('open', (ev) => {
      console.debug('[WS] Connected');
      reconnectAttempts = 0;
      if (onOpen) onOpen(ev);
    });

    socket.addEventListener('message', (ev) => {
      let data = ev.data;

      // Try to parse JSON
      try {
        data = JSON.parse(ev.data);
      } catch {
        // Keep as string if not JSON
      }

      try {
        onMessage(data);
      } catch (err) {
        console.error('[WS] Message handler error:', err);
      }
    });

    socket.addEventListener('close', (ev) => {
      console.debug('[WS] Closed:', ev.code, ev.reason);
      if (onClose) onClose(ev);
    });

    socket.addEventListener('error', (ev) => {
      console.error('[WS] Error:', ev);
      if (onError) onError(ev);
    });

    return {
      /**
       * Send message to WebSocket server
       * @param {any} message - Message to send (will be JSON-stringified if object)
       */
      send: (message) => {
        if (socket.readyState !== WebSocket.OPEN) {
          throw createError('WebSocket not connected', 503, 'WS_NOT_CONNECTED');
        }
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        socket.send(payload);
      },

      /**
       * Close WebSocket connection
       */
      close: () => {
        socket.close(1000, 'Client disconnect');
      },

      /**
       * Check if WebSocket is connected
       * @returns {boolean}
       */
      isConnected: () => socket.readyState === WebSocket.OPEN,

      /**
       * Raw WebSocket instance
       */
      socket,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Configure API client settings
   * @param {Object} options
   * @param {string} [options.basePath]
   * @param {number} [options.timeout]
   * @param {boolean} [options.cacheEnabled]
   */
  function configure(options) {
    Object.assign(CONFIG, options);
    console.debug('[API] Configuration updated:', CONFIG);
  }

  /**
   * Get current configuration
   * @returns {Object}
   */
  function getConfig() {
    return { ...CONFIG };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC INTERFACE
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // REST API
    fetchRoutes,
    fetchRoute,
    calculateNoise,
    fetchImmissionsorte,
    fetchDrones,
    fetchConfig,
    healthCheck,

    // WebSocket
    connectWs,

    // Utilities
    configure,
    getConfig,
    clearCache,
  };
})();

// Global export
if (typeof window !== 'undefined') {
  window.MORPHEUS_API = MORPHEUS_API;
}

// ES Module export (if bundler is used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MORPHEUS_API;
}
