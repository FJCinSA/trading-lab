// FJC Trading Lab - Service Worker
// Caches the app shell so it works offline / loads instantly on revisit.
// Bump CACHE_VERSION any time you deploy a new version to force refresh.

const CACHE_VERSION = 'fjc-trading-lab-v12';
const APP_SHELL = [
  './',
  './index.html',
  './trading-lab.html',
  './manifest.json',
  './icon.svg',
  // ES module files — cache all so the app works fully offline
  './js/config.js',
  './js/indicators.js',
  './js/patterns.js',
  './js/synthetic.js',
  './js/state.js',
  './js/data.js',
  './js/chart.js',
  './js/edge.js',
  './js/portfolio.js',
  './js/ai.js',
  './js/autopilot.js',
  './js/analogs.js',
  './js/replay.js',
  './js/journal.js',
  './js/crashes.js',
  './js/curriculum.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Pre-cache best-effort - if any single file 404s, don't fail the install
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Skipped pre-cache for', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never cache API calls (Anthropic proxy or future Yahoo proxy) - always go to network
  if (req.url.includes('/v1/messages') ||
      req.url.includes('workers.dev') ||
      req.url.includes('api.anthropic.com')) {
    return; // let browser handle, no service worker intervention
  }

  // Only intercept GET
  if (req.method !== 'GET') return;

  // NETWORK-FIRST for HTML / navigation requests so the user ALWAYS gets the
  // latest code on every reload. Cache is used only as offline fallback.
  const isHTML = req.mode === 'navigate'
              || (req.headers.get('accept') || '').includes('text/html')
              || req.url.endsWith('.html')
              || req.url.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // NETWORK-FIRST for JS modules — always fetch fresh code from GitHub Pages.
  // Falls back to cache only when offline. This prevents stale JS from getting
  // stuck in the cache across deployments.
  const isJS = req.url.endsWith('.js');

  if (isJS) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // CACHE-FIRST for icons, manifest, SVG - they rarely change.
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((resp) => {
          if (resp && resp.ok && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
