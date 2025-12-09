/**
 * assets/api-client.js
 *
 * Einfache API-Client-Bibliothek für das MORPHEUS Dashboard-Frontend.
 * - fetchRoutes()         => GET /api/routes
 * - calculateNoise()      => POST /api/noise/calculate
 * - fetchConfig()         => GET /api/config
 * - connectWs(onMessage)  => WebSocket Verbindung zu /ws/drone-position
 *
 * Export: window.MORPHEUS_API
 */

const MORPHEUS_API = (function () {
  const basePath = '';
  async function _fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    if (!res.ok) {
      const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
      const err = new Error('Request failed: ' + res.status + ' ' + res.statusText);
      err.response = res;
      err.body = body;
      throw err;
    }
    if (isJson) return res.json();
    return res.text();
  }
  async function fetchRoutes() { return _fetchJson(basePath + '/api/routes'); }
  async function calculateNoise(payload) {
    return _fetchJson(basePath + '/api/noise/calculate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
  }
  async function fetchConfig() { return _fetchJson(basePath + '/api/config'); }
  function connectWs(onMessage, onOpen, onClose, onError) {
    const protocol = (location.protocol === 'https:') ? 'wss' : 'ws';
    const host = location.host;
    const path = basePath + '/ws/drone-position';
    const wsUrl = `${protocol}://${host}${path}`;
    const socket = new WebSocket(wsUrl);
    socket.addEventListener('open', (ev) => { if (onOpen) onOpen(ev); });
    socket.addEventListener('message', (ev) => {
      let data = ev.data; try { data = JSON.parse(ev.data); } catch (err) {}
      try { onMessage(data); } catch (err) { console.error('onMessage handler failed', err); }
    });
    socket.addEventListener('close', (ev) => { if (onClose) onClose(ev); });
    socket.addEventListener('error', (ev) => { if (onError) onError(ev); });
    return { send: (m) => { if (socket.readyState === WebSocket.OPEN) { socket.send(typeof m === 'string' ? m : JSON.stringify(m)); } else { throw new Error('WebSocket not open'); } }, close: () => socket.close(), socket };
  }
  return { fetchRoutes, calculateNoise, fetchConfig, connectWs };
})();
window.MORPHEUS_API = MORPHEUS_API;
