const APP_CACHE_PREFIX = "app-financeiro-";
const STATIC_CACHE = `${APP_CACHE_PREFIX}static-v1`;
const MAX_ENTRIES = 128;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(APP_CACHE_PREFIX) && cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Only versioned build assets: never cache HTML, RSC navigation or API responses.
// fetch is the native service-worker transport, outside the application's Axios layer.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    request.mode === "navigate" ||
    request.cache === "no-store" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith("/_next/static/")
  ) {
    return;
  }

  event.respondWith((async () => {
    // Storage can be unavailable or full on mobile. Network loading must still work.
    const cache = await caches.open(STATIC_CACHE).catch(() => null);
    const cached = cache ? await cache.match(request).catch(() => null) : null;
    if (cached) return cached;

    const response = await fetch(request);
    if (cache && response.status === 200 && response.type === "basic" && !response.redirected) {
      const copy = response.clone();
      event.waitUntil((async () => {
        await cache.put(request, copy);
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((key) => cache.delete(key)));
      })().catch(() => {}));
    }
    return response;
  })());
});
