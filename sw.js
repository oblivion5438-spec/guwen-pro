// 顧問PRO Service Worker
const CACHE_NAME = 'guwen-pro-v1';
const ASSETS = [
  '/app.html',
  '/customer_form.html',
];

// 安裝時快取核心檔案
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {
        // 部分檔案快取失敗不影響安裝
      });
    })
  );
  self.skipWaiting();
});

// 啟用時清除舊快取
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 網路優先策略：優先用最新資料，失敗才用快取
self.addEventListener('fetch', function(e) {
  // 只處理 GET 請求
  if (e.request.method !== 'GET') return;
  // Supabase API 不快取
  if (e.request.url.includes('supabase.co')) return;
  // PayPal 不快取
  if (e.request.url.includes('paypal.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // 成功取得，同時更新快取
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // 離線時從快取讀取
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          // 如果是 HTML 頁面請求，回傳 app.html
          if (e.request.headers.get('accept').includes('text/html')) {
            return caches.match('/app.html');
          }
        });
      })
  );
});

// 推播通知處理
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '顧問PRO', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data,
      vibrate: [100, 50, 100],
      actions: data.actions || []
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.openWindow('/app.html')
  );
});
