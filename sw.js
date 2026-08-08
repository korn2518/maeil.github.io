/* 매일학습지 서비스워커 — 한 번 열어 본 학습지는 인터넷 없이도 볼 수 있게 저장한다. */
const CACHE = "maeil-2026-08-08-4";
const ASSETS = ["./", "./index.html", "./review-data.js", "./manifest.webmanifest", "./app/icon-192.png", "./app/icon-512.png", "./app/icon-maskable-512.png", "./app/apple-touch-icon.png", "./sheets/2026-08-05.html", "./sheets/2026-08-06.html", "./sheets/2026-08-07.html", "./sheets/2026-08-08.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => {
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => null);
    // 저장해 둔 것이 있으면 먼저 보여 주고, 뒤에서 조용히 새것을 받아 둔다
    return cached || (await fresh) || new Response(
      "<meta charset=utf-8><p style='font-family:sans-serif;padding:40px'>"
      + "아직 내려받지 않은 자료예요. 인터넷에 연결한 뒤 다시 열어 주세요.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } });
  })());
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
