// Sprint 5 · Web Push registration helper.
// Usage: const result = await registerPush();
//
// 1. Lee la VAPID public key del backend (/api/push/vapid-key)
// 2. Registra /sw.js (idempotente)
// 3. Pide permiso de notificaciones (si no fue concedido)
// 4. PushManager.subscribe → POST /api/push/subscribe

export type PushRegisterResult =
  | { ok: true; subscriptionId: string }
  | { ok: false; reason: 'unsupported' | 'denied' | 'not_configured' | 'error'; message?: string };

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) out[i] = rawData.charCodeAt(i);
  return out;
}

export async function registerPush(): Promise<PushRegisterResult> {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported', message: 'Tu navegador no soporta Web Push.' };
  }

  // 1. VAPID key
  let publicKey: string | null = null;
  try {
    const r = await fetch('/api/push/vapid-key', { cache: 'no-store' });
    const data = await r.json();
    if (!data.configured) {
      return {
        ok: false,
        reason: 'not_configured',
        message: data.instructions || 'Push no configurado en el servidor.',
      };
    }
    publicKey = data.public_key;
  } catch {
    return { ok: false, reason: 'error', message: 'No pude obtener la VAPID key' };
  }
  if (!publicKey) return { ok: false, reason: 'not_configured' };

  // 2. Registrar SW
  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    return { ok: false, reason: 'error', message: 'No pude registrar el service worker' };
  }
  await navigator.serviceWorker.ready;

  // 3. Permiso
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    return { ok: false, reason: 'denied', message: 'Permiso de notificaciones denegado.' };
  }

  // 4. Subscribe + POST
  let subscription: PushSubscription;
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      subscription = existing;
    } else {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
  } catch (e) {
    return { ok: false, reason: 'error', message: 'No pude crear la suscripción' };
  }

  const json = subscription.toJSON();
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      user_agent: navigator.userAgent,
      device_label: navigator.platform || 'web',
    }),
  });
  if (!res.ok) return { ok: false, reason: 'error', message: 'Backend rechazó la suscripción' };
  const data = await res.json();
  return { ok: true, subscriptionId: data.id };
}
