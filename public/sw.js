const STATIC_CACHE = "app-financeiro-static-v1";
const PRECACHE_ASSETS = [
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/logo_app.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate" || url.searchParams.has("_rsc")) {
    return;
  }

  const isNextStaticAsset = url.pathname.startsWith("/_next/static/");
  const isPublicAsset =
    /\.(?:ico|jpg|jpeg|png|svg|webp|woff2?)$/.test(url.pathname) ||
    PRECACHE_ASSETS.includes(url.pathname);

  if (!isNextStaticAsset && !isPublicAsset) {
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}
