"use strict";

const CACHE_NAME = "wellbeing-v46";
const SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=46",
  "./wellness.js?v=46",
  "./fitness.js?v=46",
  "./app.js?v=46",
  "./manifest.webmanifest",
  "./icons/favicon.ico?v=42",
  "./icons/favicon-16.png?v=42",
  "./icons/favicon-32.png?v=42",
  "./icons/favicon-48.png?v=42",
  "./icons/apple-touch-icon-v42.png",
  "./icons/icon-192.png?v=42",
  "./icons/icon-512.png?v=42",
  "./icons/icon-maskable-192.png?v=42",
  "./icons/icon-maskable-512.png?v=42"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => cache.add(SUPABASE_SDK_URL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isAppAsset = requestUrl.origin === self.location.origin;
  const isSupabaseSdk = event.request.url === SUPABASE_SDK_URL;

  // Cache only the local app shell and the pinned SDK file. Supabase REST
  // responses are user data and must always reach the network rather than a
  // stale service-worker cache entry.
  if (!isAppAsset && !isSupabaseSdk) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

function fitnessAlreadyCompleted(userId, checkpointId) {
  if (!userId || !checkpointId || !self.indexedDB) return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      const request = self.indexedDB.open("wellbeing-fitness-push-v1", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("completed")) request.result.createObjectStore("completed", { keyPath: "userId" });
      };
      request.onerror = () => resolve(false);
      request.onsuccess = () => {
        const database = request.result;
        try {
          const read = database.transaction("completed", "readonly").objectStore("completed").get(userId);
          read.onsuccess = () => {
            const found = Array.isArray(read.result?.completedIds) && read.result.completedIds.includes(checkpointId);
            database.close();
            resolve(found);
          };
          read.onerror = () => { database.close(); resolve(false); };
        } catch { database.close(); resolve(false); }
      };
    } catch { resolve(false); }
  });
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { title: "Wellbeing reminder", body: event.data?.text() || "Open Wellbeing to view your reminder." };
  }

  const title = payload.title || "Wellbeing reminder";
  const options = {
    body: payload.body || "Open Wellbeing to view your reminder.",
    icon: "./icons/icon-192.png?v=42",
    badge: "./icons/favicon-48.png?v=42",
    tag: payload.tag || `wellbeing-${payload.type || "reminder"}`,
    renotify: true,
    data: {
      notificationId: payload.notificationId || null,
      type: payload.type || "reminder",
      url: payload.url || "./?notifications=1"
    }
  };

  event.waitUntil((async () => {
    if (payload.type === "fitness" && await fitnessAlreadyCompleted(payload.userId, payload.checkpointId)) return;
    await Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "WELLBEING_PUSH_RECEIVED" }));
      })
    ]);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "./?notifications=1", self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.registration.scope));
      if (existing) {
        const notificationType = event.notification.data?.type;
        existing.postMessage({
          type: notificationType === "weight"
            ? "WELLBEING_OPEN_WEIGHT"
            : (notificationType === "waist" ? "WELLBEING_OPEN_WAIST" : notificationType === "fitness" ? "WELLBEING_OPEN_BODY" : "WELLBEING_OPEN_NOTIFICATIONS")
        });
        return existing.focus();
      }
      return self.clients.openWindow(destination);
    })
  );
});
