const CACHE_NAME = 'blog-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/styles.css',
  '/static/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        if (response) {
          return response;
        }

        // Clone the request for the fetch call
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for the cache and return
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache every response - only cache GET requests for specific types
                if (event.request.method === 'GET' && 
                   (event.request.url.includes('.css') || 
                    event.request.url.includes('.js') || 
                    event.request.url.includes('.png') || 
                    event.request.url.includes('.jpg') ||
                    event.request.url.includes('.webp') || 
                    event.request.url.includes('.svg') ||
                    event.request.url.endsWith('/'))) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});