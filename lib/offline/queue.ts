// Sprint 12 · Offline queue (IndexedDB) · same store que el Service Worker.
// Cuando el SW intercepta una mutation offline, encola aquí. Cuando vuelve
// online, drainQueue() la procesa.
//
// Esta versión client-side es para que el resto de la app pueda leer el
// estado de la cola (mostrar OfflineIndicator con N pendientes) sin tener
// que comunicarse con el SW.

const DB_NAME = 'lexai-sw';
const DB_VERSION = 1;
const STORE = 'sync_queue';

export type QueuedJob = {
  client_request_id: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  payload: unknown;
  enqueued_at: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'client_request_id' });
        store.createIndex('enqueued_at', 'enqueued_at');
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function listQueuedJobs(): Promise<QueuedJob[]> {
  if (typeof indexedDB === 'undefined') return [];
  try {
    const db = await openDB();
    return await new Promise<QueuedJob[]>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result || []) as QueuedJob[]);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function countQueuedJobs(): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0;
  try {
    const db = await openDB();
    return await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function clearQueue(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDB();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
  });
}

export async function deleteJob(client_request_id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDB();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(client_request_id);
    tx.oncomplete = () => resolve();
  });
}

/** Pide al SW que intente drenar la cola ahora. */
export async function requestDrainNow(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  reg?.active?.postMessage({ type: 'lexai:drain-now' });
  // Background sync (cuando el browser lo permita)
  try {
    // @ts-ignore SyncManager
    if (reg && 'sync' in reg) await reg.sync.register('lexai-drain-queue');
  } catch {}
}
