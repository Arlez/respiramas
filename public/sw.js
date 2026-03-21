/// <reference lib="webworker" />

const CACHE_NAME = 'vivir-mejor-v1';
const OFFLINE_URL = '/';

const PRECACHE_URLS = [
  '/',
  '/respiratorio',
  '/ejercicio',
  '/cardiorrenal',
  '/energia',
  '/medicacion',
  '/nutricion',
  '/mental',
];

// Instalación: precachear recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Vivir Mejor', body: 'Tienes un recordatorio', tag: 'general' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: data.tag || 'general',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: data,
    })
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlMap = {
    medicacion: '/medicacion',
    ejercicio: '/ejercicio',
    respiratorio: '/respiratorio',
    registro: '/',
  };

  const tag = event.notification.tag || 'general';
  const url = urlMap[tag] || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Alarmas periódicas (para recordatorios programados)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkAndSendReminders());
  }
});

async function checkAndSendReminders() {
  // Este handler se activa periódicamente para verificar recordatorios pendientes
  self.registration.showNotification('Vivir Mejor', {
    body: '¿Ya registraste tus métricas de hoy?',
    icon: '/icons/icon-192.svg',
    tag: 'registro',
    vibrate: [200, 100, 200],
  });
}
