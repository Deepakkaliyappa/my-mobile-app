/* Sri Durga Billing — service worker.
   1) Pre-saves every app file on first visit, so the app opens fully OFFLINE.
   2) Network-first: when online it always loads the newest files.
   Change CACHE (e.g. v9) whenever you upload new files, to refresh every phone. */
const CACHE = "sd-billing-v9";
const CORE = [
  "./", "index.html", "manifest.json",
  "css/style.css", "css/ui.css", "css/fonts.css",
  "js/app.js", "html2pdf.bundle.min.js",
  "assets/sri-durga-logo-line.png", "logo.jpeg"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // add files one by one so a single missing file never breaks the install
      return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match("index.html"); });
      })
  );
});