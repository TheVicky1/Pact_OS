/**
 * PACT OS — Progressive Web App Service Worker
 * Version: pact-static-v1
 * 
 * Guarantees:
 * 1. Zero Private Data Caching: Strictly avoids caching dynamic authenticated API responses
 *    or Supabase auth endpoints to prevent cross-user data leakage.
 * 2. Cache-First for static assets (icons, logos, fonts, static branding).
 * 3. Network-First with safe fallback for navigation requests.
 */

const CACHE_NAME = 'pact-static-v1';

const STATIC_PRECACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/brand/pact-app-icon-192.png',
  '/brand/pact-app-icon-512.png',
  '/brand/pact-logo-64.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests (mutations must always reach network/sync queue)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Never cache authenticated API endpoints or external auth/DB services
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // 3. Static Assets: Cache-First strategy with network fallback
  if (
    url.pathname.startsWith('/brand/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json') ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. HTML Navigation Requests: Network-First with safe offline cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/app').then((cachedApp) => {
          if (cachedApp) return cachedApp;
          return new Response(
            `<!DOCTYPE html>
            <html lang="en" class="dark">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>PACT OS — Offline</title>
              <style>
                body { background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
                .card { background: #121217; border: 1px solid rgba(212,175,55,0.3); border-radius: 20px; padding: 32px; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                h1 { color: #d4af37; font-size: 20px; margin-bottom: 8px; }
                p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px; }
                button { background: #d4af37; color: #09090b; border: none; font-weight: 600; padding: 10px 20px; border-radius: 10px; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Offline Mode</h1>
                <p>You are currently offline. PACT will safely queue any quick captures and synchronize when your connection is restored.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html' },
            }
          );
        });
      })
    );
  }
});
