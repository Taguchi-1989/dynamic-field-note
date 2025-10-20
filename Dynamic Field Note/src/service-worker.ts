/**
 * Service Worker for Dynamic Field Note
 * Phase 5: PWA化 - オフライン対応とキャッシュ戦略
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Service Worker version for cache management
const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'dfn';

/**
 * Precache static assets
 * Workbox will inject the manifest during build
 */
precacheAndRoute(self.__WB_MANIFEST || []);

/**
 * Strategy 1: Images - Cache First
 * 画像は一度キャッシュしたら長期間使用
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * Strategy 2: Fonts - Cache First
 * フォントは変更頻度が低いため長期キャッシュ
 */
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

/**
 * Strategy 3: API - Stale While Revalidate
 * APIは古いキャッシュを返しつつバックグラウンドで更新
 */
registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/') || url.hostname.includes('generativelanguage.googleapis.com'), // Gemini API
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

/**
 * Strategy 4: JavaScript/CSS - Network First
 * JSとCSSは最新版を優先するがオフライン時はキャッシュ使用
 */
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
);

/**
 * Strategy 5: HTML - Network First
 * HTMLは常に最新を取得、オフライン時のみキャッシュ
 */
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-html-${CACHE_VERSION}`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

/**
 * Service Worker lifecycle events
 */

// Install event - activate immediately
self.addEventListener('install', (_event) => {
  console.log('[Service Worker] Install event');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => {
            // Delete caches from old versions
            return name.startsWith(CACHE_PREFIX) && !name.includes(CACHE_VERSION);
          })
          .map((name) => {
            console.log(`[Service Worker] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );

      // Take control of all clients immediately
      await self.clients.claim();
    })()
  );
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Export for TypeScript
export {};
