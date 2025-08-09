// Service Worker for Enjoy The Gifts PWA with Firebase Support
const CACHE_NAME = 'enjoy-gifts-firebase-v1.0.1';
const urlsToCache = [
  './',
  './index.html',
  './database.js',
  './manifest.json',
  './app-icon.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline, but allow Firebase requests
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Always allow Firebase requests to go through
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase.googleapis.com') ||
      event.request.url.includes('identitytoolkit.googleapis.com') ||
      event.request.url.includes('gstatic.com/firebasejs')) {
    console.log('Service Worker: Allowing Firebase request', event.request.url);
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Add to cache for future use (except Firebase URLs)
          if (!event.request.url.includes('firebase') && 
              !event.request.url.includes('firestore') &&
              !event.request.url.includes('gstatic.com/firebasejs')) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed', error);
        
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        
        // For other requests, just fail
        throw error;
      })
  );
});

// Background sync for data synchronization
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'firebase-sync') {
    event.waitUntil(doFirebaseSync());
  }
});

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'Enjoy The Gifts',
    body: 'إشعار جديد من متجرك',
    icon: './app-icon.jpg',
    badge: './app-icon.jpg'
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: notificationData.url || './'
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: './app-icon.jpg'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: './app-icon.jpg'
      }
    ],
    requireInteraction: true,
    tag: 'enjoy-gifts-notification'
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    const urlToOpen = event.notification.data.url || './';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Check if app is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Firebase background sync function
async function doFirebaseSync() {
  try {
    console.log('Service Worker: Performing Firebase sync');
    
    // Send message to main thread to trigger sync
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'firebase-sync'
      });
    });
    
    console.log('Service Worker: Firebase sync message sent to clients');
    
  } catch (error) {
    console.error('Service Worker: Firebase sync error', error);
  }
}

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'SYNC_STATUS') {
    // Handle sync status updates from main thread
    console.log('Service Worker: Sync status update', event.data.status);
  }

  if (event.data && event.data.type === 'REGISTER_SYNC') {
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      self.registration.sync.register('firebase-sync')
        .then(() => {
          console.log('Service Worker: Background sync registered');
        })
        .catch(error => {
          console.error('Service Worker: Background sync registration failed', error);
        });
    }
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker: Error occurred', event.error);
  
  // Send error to main thread for logging
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ERROR',
        error: event.error.message
      });
    });
  });
});

// Unhandled rejection handling
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault();
  
  // Send error to main thread for logging
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UNHANDLED_REJECTION',
        reason: event.reason
      });
    });
  });
});

// Network status change handling
self.addEventListener('online', event => {
  console.log('Service Worker: Network online');
  
  // Trigger sync when coming back online
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: true
      });
    });
  });
  
  // Register background sync
  if ('sync' in self.registration) {
    self.registration.sync.register('firebase-sync');
  }
});

self.addEventListener('offline', event => {
  console.log('Service Worker: Network offline');
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        online: false
      });
    });
  });
});

console.log('Service Worker: Script loaded');

