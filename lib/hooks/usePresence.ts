'use client';

import { useEffect } from 'react';

/**
 * Sprint 16 · Heartbeat de presencia.
 *
 * Mientras el componente está montado:
 *  - manda un POST a /api/presence/heartbeat cada 30s
 *  - cuando se desmonta, manda POST a /api/presence/leave (best-effort)
 *
 * El backend tiene TTL 90s en la query de activos, así que si el usuario
 * cierra la pestaña sin notificar, desaparece de la lista naturalmente.
 *
 * Pasar `enabled=false` o `matterId=null` desactiva el heartbeat.
 */
export function usePresence({
  matterId,
  locationKind = 'matter',
  locationRef,
  enabled = true,
  intervalMs = 30_000,
}: {
  matterId: string | null | undefined;
  locationKind?: 'matter' | 'matter_document' | 'canvas' | 'dashboard' | 'other';
  locationRef?: string | null;
  enabled?: boolean;
  intervalMs?: number;
}) {
  useEffect(() => {
    if (!enabled || !matterId) return;
    let cancelled = false;

    const send = async () => {
      if (cancelled) return;
      try {
        await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            matter_id: matterId,
            location_kind: locationKind,
            location_ref: locationRef ?? null,
          }),
          cache: 'no-store',
        });
      } catch {
        /* offline / unauth · ignoramos */
      }
    };

    void send();
    const t = setInterval(send, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(t);
      // Best-effort leave (no await, navega antes que termine).
      try {
        const data = JSON.stringify({
          matter_id: matterId,
          location_kind: locationKind,
          location_ref: locationRef ?? null,
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon('/api/presence/leave', blob);
        } else {
          void fetch('/api/presence/leave', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: data,
            keepalive: true,
          });
        }
      } catch {
        /* ignore */
      }
    };
  }, [matterId, locationKind, locationRef, enabled, intervalMs]);
}
