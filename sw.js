/* 매일학습지 서비스워커 — 한 번 열어 본 학습지는 인터넷 없이도 볼 수 있게 저장한다. */
const CACHE = "maeil-7b4be09870";
const ASSETS = ["./", "./index.html", "./review-data.js", "./manifest.webmanifest", "./app/pen.js", "./app/pentab.js", "./app/hl.js", "./app/logo.png", "./app/icon-192.png", "./app/icon-512.png", "./app/icon-maskable-512.png", "./app/apple-touch-icon.png", "./sheets/2026-08-05.html", "./sheets/2026-08-06.html", "./sheets/2026-08-07.html", "./sheets/2026-08-08.html", "./sheets/2026-08-09.html"];

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

function isPage(req) {
  return req.mode === "navigate"
      || (req.headers.get("accept") || "").includes("text/html");
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith((async () => {
    const save = res => {
      if (res && res.ok && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    };

    // 화면(HTML)은 늘 새것을 먼저 받아 온다.
    // 저장해 둔 것을 먼저 보여 주면, 학습지를 새로 올려도 옛 화면이 계속 뜬다.
    if (isPage(e.request)) {
      try {
        const fresh = await fetch(e.request, { cache: "no-store" });
        if (fresh && fresh.ok) return save(fresh);
        // 서버가 404를 주면 저장해 둔 것이라도 보여 준다
        const cached = await caches.match(e.request, { ignoreSearch: true });
        return cached || fresh;
      } catch (err) {
        const cached = await caches.match(e.request, { ignoreSearch: true });
        return cached || offlineNote();
      }
    }

    // 그림·아이콘 같은 것은 저장해 둔 것을 먼저 쓴다 (빠르다)
    const cached = await caches.match(e.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return save(await fetch(e.request));
    } catch (err) {
      return offlineNote();
    }
  })());
});

function offlineNote() {
  return new Response(
    "<meta charset=utf-8><p style='font-family:sans-serif;padding:40px'>"
    + "아직 내려받지 않은 자료예요. 인터넷에 연결한 뒤 다시 열어 주세요.</p>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: "window" });
    cs.forEach(c => c.postMessage({ type: "updated", version: CACHE }));
  })());
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
