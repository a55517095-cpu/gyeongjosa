/* =========================================================
 *  경조사 장부 - Service Worker
 *
 *  역할: 화면 파일(HTML·아이콘)을 저장해 두어 다시 열 때 바로 뜨게 함.
 *        장부 데이터(구글 Apps Script)는 절대 저장하지 않음.
 *
 *  ⚠️ index.html 을 고친 뒤에는 아래 CACHE 버전을 반드시 올리세요.
 *     (gj-v1 → gj-v2 → ...)  안 올리면 폰에 옛 화면이 계속 보입니다.
 * ========================================================= */

const CACHE = 'gj-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;   // 구글 서버 요청은 건드리지 않음

  // 캐시를 먼저 주고, 뒤에서 최신본을 받아 캐시를 갱신
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
