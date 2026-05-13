const CACHE_NAME = "nidus-shell-v5";
const STATIC_ASSETS = ["/offline", "/manifest.webmanifest", "/icons/icon-192.svg", "/icons/icon-512.svg"];
const SYNC_DB = "nidus-offline-sync";
const SYNC_STORE = "requests";

function openSyncDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(SYNC_STORE, { keyPath: "id", autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueMutation(request) {
  const clone = request.clone();
  const body = await clone.text();
  const headers = {};
  clone.headers.forEach((value, key) => {
    if (!["authorization", "cookie"].includes(key.toLowerCase())) headers[key] = value;
  });
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, "readwrite");
    tx.objectStore(SYNC_STORE).add({ url: clone.url, method: clone.method, headers, body, createdAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function replayMutations() {
  const db = await openSyncDb();
  const pending = await new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, "readonly");
    const request = tx.objectStore(SYNC_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  for (const item of pending) {
    const response = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body || undefined, credentials: "include" });
    if (response.ok) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(SYNC_STORE, "readwrite");
        tx.objectStore(SYNC_STORE).delete(item.id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.pathname.startsWith("/api")) {
      event.respondWith(
        fetch(event.request.clone()).catch(async () => {
          await queueMutation(event.request);
          if ("sync" in self.registration) {
            await self.registration.sync.register("nidus-offline-mutations");
          }
          return new Response(JSON.stringify({ queued: true, message: "Queued for sync" }), { status: 202, headers: { "Content-Type": "application/json" } });
        })
      );
    }
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith("/api")) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ message: "Offline" }), { status: 503, headers: { "Content-Type": "application/json" } })));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline")));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/offline")))
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "nidus-offline-mutations") {
    event.waitUntil(replayMutations());
  }
});
