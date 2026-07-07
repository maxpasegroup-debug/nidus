const OFFLINE_DB = "nidus-offline-mutations";
const STORE = "requests";
const SYNC_TAG = "nidus-replay-exam-mutations";

function openQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, operation) {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = operation(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function queueRequest(request) {
  const headers = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  const body = await request.clone().text();
  await withStore("readwrite", (store) => store.add({
    url: request.url,
    method: request.method,
    headers,
    body,
    createdAt: Date.now(),
  }));
  if (self.registration.sync) await self.registration.sync.register(SYNC_TAG).catch(() => undefined);
}

async function replayQueue() {
  const queued = await withStore("readonly", (store) => store.getAll());
  for (const item of queued) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
        credentials: "include",
      });
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await withStore("readwrite", (store) => store.delete(item.id));
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim().then(replayQueue)));
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "REPLAY_OFFLINE_MUTATIONS") event.waitUntil(replayQueue());
});
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(replayQueue());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const queueable = request.method === "POST" && (
    url.pathname.endsWith("/api/tests/autosave") ||
    url.pathname.endsWith("/api/tests/integrity-event")
  );
  if (!queueable) return;

  event.respondWith(fetch(request.clone()).then((response) => {
    if (response.ok) event.waitUntil(replayQueue());
    return response;
  }).catch(async () => {
    await queueRequest(request);
    return new Response(JSON.stringify({
      queued: true,
      message: "Exam progress is saved on this device and will sync when the connection returns.",
    }), { status: 202, headers: { "Content-Type": "application/json" } });
  }));
});
