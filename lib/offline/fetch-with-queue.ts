// Sprint 12 · fetch wrapper opt-in para mutations offline-safe.
// Uso desde componentes que quieran que sus POST/PATCH/DELETE encolen
// automáticamente cuando hay error de red:
//
//   import { offlineFetch } from '@/lib/offline/fetch-with-queue';
//   const r = await offlineFetch('/api/leads', { method: 'POST', body: ... });
//
// Si el SW está activo, el SW intercepta y encola. Esta función solo añade
// el header `x-client-request-id` para idempotency. Si NO hay SW activo,
// hace fetch directo (degrada gracefully).

export function generateUUID(): string {
  const c = (typeof crypto !== 'undefined' ? crypto : undefined) as Crypto | undefined;
  if (c && 'randomUUID' in c) {
    return c.randomUUID();
  }
  // Fallback RFC4122 v4
  const bytes = (c ?? window.crypto).getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function offlineFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('x-client-request-id')) {
    headers.set('x-client-request-id', generateUUID());
  }
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  return fetch(input, { ...init, headers });
}
