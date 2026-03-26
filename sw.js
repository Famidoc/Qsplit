const CACHE_NAME = 'qsplit-cache-v10'; 
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. 安裝階段：把檔案存入快取
self.addEventListener('install', event => {
  self.skipWaiting(); // 強制立刻接管，不等待
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 2. 🌟 新增的清除魔法：啟動時，把舊版本 (v1, v2) 的快取通通刪掉！
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. 🌟 升級的抓取策略：「網路優先 (Network First)」
// 每次都先去網路抓最新的，如果沒網路 (斷線)，才退回去拿快取的檔案
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // 如果 fetch 失敗 (例如斷網)，就從 cache 裡面找
        return caches.match(event.request);
      })
  );
});