/**
 * sw.js — Service Worker
 * Typeopplæring.no Safety Training Platform
 * Cache-first for assets, network-first for API calls
 */

const CACHE_NAME = 'typeopplaering-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './design-system.css',
  './layout.css',
  './animations.css',
  './components.css',
  './app.js',
  './i18n.js',
  './api.js',
  './auth.js',
  './utils.js',
  './catalog.js',
  './course.js',
  './assessment.js',
  './payment.js',
  './signature.js',
  './certificate.js',
  './admin.js',
  './company.js',
  './profile.js',
  './qr.js',
  './checklist.js',
  './hero_bg.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(
        STATIC_ASSETS.filter(url => !url.startsWith('https://fonts.googleapis'))
      ).catch(err => console.warn('Cache install warning:', err));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch Strategy ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin API calls (Apps Script)
  if (request.method !== 'GET') return;
  if (url.hostname === 'script.google.com') return;
  if (url.hostname === 'api.stripe.com') return;

  // Fonts: cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Images: cache-first with fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // App shell (HTML, CSS, JS): stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      });
      return cached || networkFetch;
    })
  );
});

// ── Background Sync (for offline form submissions) ────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncOfflineProgress());
  }
  if (event.tag === 'sync-checklist') {
    event.waitUntil(syncOfflineChecklists());
  }
});

async function syncOfflineProgress() {
  // In production: read from IndexedDB and POST to API
  console.log('[SW] Syncing offline course progress...');
}

async function syncOfflineChecklists() {
  console.log('[SW] Syncing offline checklists...');
}

// ── Push Notifications (for certificate ready, approval pending) ───────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Oslo Liftutleie', {
      body: data.body || 'Du har en ny varsling',
      icon: './icon-192.png',
      badge: './icon-96.png',
      tag: data.tag || 'general',
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || './')
  );
});
