/* 곰돌이 학습장 — 서비스워커 (자동 생성: 엔진/make_pwa.py) */
const CACHE = "bear-5318c93bf5";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app/app.js",
  "./app/plan.js",
  "./app/chart.js",
  "./app/bank-math.js",
  "./app/bank-en.js",
  "./app/bank-ko.js",
  "./app/bank-ko2.js",
  "./app/bank-ko3.js",
  "./app/pen.js",
  "./app/hl.js",
  "./app/logo.png",
  "./app/icon-192.png",
  "./app/icon-512.png",
  "./app/icon-maskable-512.png",
  "./app/apple-touch-icon.png",
  "./archive.html",
  "./wordbook.html"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

/* 앱 껍데기는 네트워크를 먼저 보고, 안 되면 저장해 둔 것을 쓴다.
   (학습 내용은 모두 앱 안에 들어 있어 인터넷 없이도 돌아간다) */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // 메일 발송·CDN 은 건드리지 않는다

  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
