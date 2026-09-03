"use strict";

const CACHE_NAME = "wellbeing-v33";
const SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=33",
  "./wellness.js?v=33",
  "./app.js?v=33",
  "./manifest.webmanifest",
  "./icons/favicon.ico",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
  "./icons/favicon-48.png",
  "./icons/apple-touch-icon-v31.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
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
    icon: "./icons/icon-192.png",
    badge: "./icons/favicon-48.png",
    tag: payload.tag || `wellbeing-${payload.type || "reminder"}`,
    renotify: true,
    data: {
      notificationId: payload.notificationId || null,
      type: payload.type || "reminder",
      url: payload.url || "./?notifications=1"
    }
  };

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "WELLBEING_PUSH_RECEIVED" }));
    })
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "./?notifications=1", self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.registration.scope));
      if (existing) {
        existing.postMessage({ type: "WELLBEING_OPEN_NOTIFICATIONS" });
        return existing.focus();
      }
      return self.clients.openWindow(destination);
    })
  );
});
