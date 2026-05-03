// 顧問PRO Service Worker
// 主要功能：推播通知接收 + 點擊跳轉

const CACHE_NAME = 'guwen-pro-v2';

self.addEventListener('install', function(event) {
  // 立即啟用新 SW，不等舊的關閉
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      // 立即接管所有頁面
      self.clients.claim(),
      // 清掉舊版本快取
      caches.keys().then(function(keys) {
        return Promise.all(keys.filter(function(k) {
          return k !== CACHE_NAME;
        }).map(function(k) {
          return caches.delete(k);
        }));
      })
    ])
  );
});

// 收到推播通知 → 顯示通知
self.addEventListener('push', function(event) {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: '顧問PRO', body: event.data.text() };
  }
  const title = data.title || '顧問PRO';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 點通知 → 開啟 / 聚焦 app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/app.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 找已開的視窗
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/app.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // 沒有就開新視窗
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// fetch 不快取（保持每次都從網路抓最新版本）
self.addEventListener('fetch', function(event) {
  // 直接走網路，不攔截
});
