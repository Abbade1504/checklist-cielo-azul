/* Service worker – permite abrir la app sin internet y enviar después */
importScripts('cola.js');

var VERSION = 'checklist-v1';
var ARCHIVOS = ['./', 'index.html', 'cola.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // la API va directo a internet
  // Primero internet (para tener la última versión); si no hay, lo guardado
  e.respondWith(
    fetch(req).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copia); });
      return r;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});

// Android: Chrome despierta al service worker cuando vuelve la señal
self.addEventListener('sync', function (e) {
  if (e.tag === 'enviar-checklist') {
    e.waitUntil(Cola.enviarPendientes().then(function (r) {
      return self.clients.matchAll().then(function (cs) { cs.forEach(function (c) { c.postMessage({ tipo: 'sync', r: r }); }); });
    }));
  }
});
