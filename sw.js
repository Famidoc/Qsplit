const CACHE_NAME = 'qsplit-cache-v1';
// 這裡列出我們希望讓手機離線暫存的檔案 (使用相對路徑)
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝 Service Worker 時，把檔案塞進快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 當 App 要求讀取檔案時，先看快取有沒有，沒有再去網路抓
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});