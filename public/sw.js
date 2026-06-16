// RK/stats service worker — basic offline support.
const CACHE = "rkstats-v1";
const SHELL = ["/", "/icons/icon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Cache Brawlify CDN icons (stale-while-revalidate).
  if (url.hostname === "cdn.brawlify.com") {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        const fetched = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => hit);
        return hit || fetched;
      })
    );
    return;
  }

  // Don't cache API calls — always fresh.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for navigations, fall back to cached shell.
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match("/")));
  }
});
