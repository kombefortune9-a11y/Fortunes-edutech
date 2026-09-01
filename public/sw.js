const CACHE_NAME = 'fortunes-edutech-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/sw.js'
];

// Precache the core shell assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell and static resources...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Clean up old stale caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Offline-first fetching logic with advanced routing strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip WebSocket, local tools, non-http protocols, and standard system extensions
  if (!request.url.startsWith('http')) {
    return;
  }

  // 1. API Endpoints & Firebase Services: Network-First with Graceful Offline Handshake Fallback
  if (url.pathname.includes('/api/') || request.url.includes('firestore.googleapis.com') || request.url.includes('googleapis.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('[Service Worker] Connection offline. Gracefully bypassing dynamic server request:', request.url);
        // Respond with offline JSON fallback so the app can handle it elegantly
        const offlineResponse = {
          offline: true,
          status: "offline",
          message: "Secure client operates in localized offline cache mode.",
          timestamp: new Date().toISOString()
        };
        return new Response(JSON.stringify(offlineResponse), {
          status: 200, // Serve as OK with offline flags to prevent client errors
          statusText: "OK",
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // 2. Navigation Request (SPA Route Loading)
  // Network-First with Cache Fallback to the Main Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Offline fallback triggered for navigation route:', request.url);
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // 3. Immutable Hashed Static Assets (Vite's /assets/... files or stable static images)
  // Cache-First strategy: Serve from cache immediately; fetch from network only on cache miss.
  const isViteAsset = url.pathname.startsWith('/assets/');
  const isImageOrMedia = /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|mp3|mp4)$/i.test(url.pathname);

  if (isViteAsset || (isImageOrMedia && !url.pathname.endsWith('.apk'))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[Service Worker] Cache-First fetch failed for:', request.url, err);
          // Return empty file or default fallback if needed
        });
      })
    );
    return;
  }

  // 4. General Mutable Static Assets (e.g. manifest.json, sw.js, configuration files)
  // Stale-While-Revalidate: Return cached copy immediately for extreme speeds, update cache in background.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[Service Worker] Stale-While-Revalidate network update failed (expected offline):', request.url);
      });

      return cachedResponse || fetchPromise;
    })
  );
});

