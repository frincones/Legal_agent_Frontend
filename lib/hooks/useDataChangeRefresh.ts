'use client';

/**
 * useDataChangeRefresh · escucha el CustomEvent `lexai:data-changed` que el
 * `VoiceProvider` dispatchea cuando una tool del agente devuelve
 * `_ui_command: data_changed`. Filtra por resource (y opcionalmente por
 * matter_id) y llama el `refresh` que el componente expone.
 *
 * Uso típico (en un client component que tiene su propio `refresh()`):
 *
 *   const refresh = useCallback(async () => { ... fetch ... setItems(...) }, [deps]);
 *   useDataChangeRefresh(['tasks'], refresh, { matterId });
 *
 * El `resources` array puede contener varios para componentes que muestran
 * data mixta (ej. el resumen del caso lista deadlines + notas + partes).
 *
 * Ver `docs/agent-ui-sync-audit.md` y `lib/voice/ui-command-bus.ts` para la
 * lista canónica de resources.
 */

import { useEffect, useRef } from 'react';
import type {
  DataChangedEventDetail,
  DataChangedResource,
} from '@/lib/voice/ui-command-bus';

type RefreshFn = () => void | Promise<void>;

export interface UseDataChangeRefreshOptions {
  /** Si se pasa, solo refresca cuando el evento trae este matter_id (o no trae). */
  matterId?: string | null;
  /** Throttle entre invocaciones · default 250ms para evitar refetch storm
   *  cuando una sola tool dispara varios data_changed seguidos. */
  throttleMs?: number;
}

export function useDataChangeRefresh(
  resources: DataChangedResource | DataChangedResource[],
  refresh: RefreshFn,
  options: UseDataChangeRefreshOptions = {},
): void {
  const matterId = options.matterId ?? undefined;
  const throttleMs = options.throttleMs ?? 250;
  const lastFiredRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const watched: DataChangedResource[] = Array.isArray(resources)
      ? resources
      : [resources];

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<DataChangedEventDetail>).detail;
      if (!detail || typeof detail !== 'object') return;
      if (!watched.includes(detail.resource)) return;
      // Si el componente filtra por matter, ignora eventos de OTRO matter.
      // Un evento sin matter_id (firm-wide) siempre pasa.
      if (matterId && detail.matter_id && detail.matter_id !== matterId) return;

      const now = Date.now();
      if (now - lastFiredRef.current < throttleMs) return;
      lastFiredRef.current = now;
      try {
        const out = refresh();
        if (out && typeof (out as Promise<void>).then === 'function') {
          (out as Promise<void>).catch(() => {
            /* swallow · refresh handles its own errors */
          });
        }
      } catch {
        /* swallow */
      }
    };

    window.addEventListener('lexai:data-changed', handler);
    return () => {
      window.removeEventListener('lexai:data-changed', handler);
    };
    // Re-suscribimos cuando cambia la función refresh o el matterId.
  }, [refresh, matterId, throttleMs, resources]);
}
