// Service worker for Profesori PWA.
//
// Strategy:
//   - GET navigation requests: network first; fall back to /offline cache on
//     failure (user is on the train, on a phone with no signal, etc.)
//   - Static assets: pass-through (Next + Vercel already set cache headers,
//     no point caching twice client-side and risking stale chunks across
//     deploys)
//   - Everything else (POST, cross-origin, etc.): pass-through
//
// We deliberately do NOT cache HTML for authenticated routes — login state
// differs per user and per request, and stale auth states are confusing.
// The offline page is a static "you're offline" stub.

const CACHE = "profesori-shell-v1";
const SHELL_URLS = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Drop caches from earlier versions.
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Only handle same-origin.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests → network first, fall back to /offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("/offline").then((r) => r ?? new Response("Offline.")),
      ),
    );
  }
});
