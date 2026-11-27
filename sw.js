// Service worker: primero la red (para recibir cambios) y, si falla o tarda, la copia guardada.
// Al publicar una versión, cambia VERSION (tools/validar.js comprueba que coincida).
const VERSION = "3.3.0";
const CACHE = "ea-" + VERSION;
const CON_VERSION = [
  "css/style.css",
  "js/lib/chess.min.js",
  "js/pieces.js",
  "js/data/italiana.js",
  "js/data/carokann.js",
  "js/arbol.js",
  "js/motor.js",
  "js/sonidos.js",
  "js/version.js",
  "js/menu.js",
  "js/app.js",
  "js/splash.js",
  "js/offline.js"
];
const FIJOS = [
  "./",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png"
];

self.addEventListener("install", event => {
  const urls = FIJOS.concat(CON_VERSION.map(f => `${f}?v=${VERSION}`));
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(urls.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ea-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function responder(request) {
  const cache = await caches.open(CACHE);
  const guardada = async () =>
    (await cache.match(request)) ||
    (request.mode === "navigate" ? await cache.match("./") : undefined);

  const red = fetch(request);
  try {
    const copia = await guardada();
    // Con copia disponible no se espera más de 3 s a una red lenta
    const respuesta = copia
      ? await Promise.race([red, new Promise((_, no) => setTimeout(() => no(new Error("lenta")), 3000))])
      : await red;
    return respuesta.ok || !copia ? respuesta : copia;
  } catch (e) {
    return (await guardada()) || Response.error();
  }
}

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  event.respondWith(responder(event.request));
});
