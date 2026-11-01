const VERSION = 'v2';
const SHELL_CACHE = 'sierra-shell-' + VERSION;
const DATA_CACHE = 'sierra-data-' + VERSION;
const SHELL = ['./', './index.html', './styles.css', './app.js', './storage.js', './manifest.json', './offline.html', './data/catalog.json', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sierra-') && ![SHELL_CACHE, DATA_CACHE].includes(key)).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(DATA_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('./index.html')) || caches.match('./offline.html')));
  } else if (url.pathname.includes('/api/') || url.pathname.endsWith('/data/catalog.json')) {
    event.respondWith(caches.open(DATA_CACHE).then(async cache => {
      const cached = await cache.match(request);
      const network = fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; }).catch(() => cached);
      return cached || network;
    }));
  } else {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(SHELL_CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});
