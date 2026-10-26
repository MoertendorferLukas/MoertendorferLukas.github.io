// Offline-Modus: Seite und Spiele starten auch ohne Internet.
// Eigene Dateien: zuerst aus dem Netz (damit Änderungen sofort ankommen), ohne Netz aus dem Speicher.
// Schriften und Bibliotheken von CDNs: einmal geladen, danach aus dem Speicher.
const CACHE = 'lm-offline-v1';
const CDN_CACHE = 'lm-cdn-v1';
const NETZ_MS = 3500;

const DATEIEN = [
  './', 'index.html', 'zweiSpieler.html', 'zweispieler/spiele.js', 'zweispieler/icons.js',
  'dinoGoesFishing.html', 'spiderDinoGame.html', 'dinoWeitwurf.html', 'mampfosaurus.html',
  'dinoPirat.html', 'geheimnisse.html',
  'site.webmanifest', 'zweispieler.webmanifest', 'favicon.ico', 'apple-touch-icon.png',
  'img/icons/favicon-32.png', 'img/icons/icon-192.png', 'img/icons/icon-512.png', 'img/icons/maskable-512.png',
  'img/icons/zweispieler-32.png', 'img/icons/zweispieler-180.png', 'img/icons/zweispieler-192.png',
  'img/icons/zweispieler-512.png', 'img/icons/zweispieler-maskable-512.png',
  'img/spiele/dinoangler.jpg', 'img/spiele/spiderrex.jpg', 'img/spiele/weitwurf.jpg', 'img/spiele/mampfosaurus.jpg',
  'img/spiele/rexbart.jpg', 'img/spiele/runner.jpg', 'img/spiele/geheimnisse.jpg'
];
// Wird beim Installieren schon mal geholt, klappt das nicht, ist es auch egal
const CDN_VORAB = [
  'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
  'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'
];
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'unpkg.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(DATEIEN.map(u => new Request(u, { cache: 'reload' })));
    const cdn = await caches.open(CDN_CACHE);
    await Promise.all(CDN_VORAB.map(u => cdn.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== CDN_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) e.respondWith(eigene(e));
  else if (CDN_HOSTS.includes(url.hostname)) e.respondWith(cdn(req));
});

async function eigene(e) {
  const req = e.request, c = await caches.open(CACHE);
  const netz = fetch(req).then(res => {
    if (res.ok && res.type === 'basic') c.put(req, res.clone());
    return res;
  });
  e.waitUntil(netz.catch(() => {}));
  const ausSpeicher = () => c.match(req, { ignoreSearch: true })
    .then(r => r || (req.mode === 'navigate' ? c.match('index.html') : undefined));
  // Bei sehr langsamem Netz nicht ewig warten, wenn eine gespeicherte Version da ist
  const zuLangsam = new Promise(ok => setTimeout(ok, NETZ_MS)).then(ausSpeicher);
  try {
    const res = await Promise.race([netz, zuLangsam.then(r => r || netz)]);
    if (res) return res;
  } catch (_) {}
  return (await ausSpeicher()) || Response.error();
}

async function cdn(req) {
  const c = await caches.open(CDN_CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') c.put(req, res.clone());
  return res;
}
