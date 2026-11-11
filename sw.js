/* Service worker de Costa Brava Submarina.
   - Pàgina i fitxers propis: primer la xarxa (per veure sempre la versió més nova), i la còpia guardada si no hi ha connexió.
   - Fotos d'iNaturalist i tipografies de Google: primer la còpia guardada, i la xarxa només la primera vegada.
   Per forçar que tothom descarregui de nou els fitxers propis, canvia el número de VERSIO. */
const VERSIO = 'v1';
const APP = 'cbs-app-' + VERSIO;
const EXTERNS = 'cbs-externs';
const ESSENCIALS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(ESSENCIALS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n.startsWith('cbs-app-') && n !== APP).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fitxers propis: xarxa primer, còpia si no hi ha connexió
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copia = res.clone(); caches.open(APP).then(c => c.put(req, copia)); }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Fotos i tipografies: còpia guardada primer
  if (/inaturalist-open-data|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(
      caches.open(EXTERNS).then(c => c.match(req).then(r => r || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      })))
    );
  }
});
