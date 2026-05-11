// EscrowHubs Service Worker — unregister on install
// Replaced to fix NS_ERROR_CORRUPTED_CONTENT conflicts with cache-control headers
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
  self.clients.claim();
});
