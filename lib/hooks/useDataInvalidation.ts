'use client';

/**
 * useDataInvalidation · Capa 2 de la sincronización agente↔UI.
 *
 * Conecta el bus `lexai:data-changed` con TanStack Query. Cuando una tool
 * del agente emite `_ui_command: data_changed`, este hook invalida las
 * queryKeys correspondientes para que los `useQuery` registrados refetcheen
 * automáticamente (más fino que `router.refresh()` que re-ejecuta el
 * segmento RSC entero).
 *
 * Estado actual: la mayoría de los componentes aún usan `useEffect+fetch`
 * en vez de `useQuery`. Capa 1 (CustomEvent + refresh local) ya los cubre.
 * Capa 2 entra en juego cuando un componente migra a `useQuery({queryKey: ...})`.
 *
 * Convención de queryKey (canónica):
 *   - Lista global de un resource:        [resource]
 *   - Lista filtrada por matter:          [resource, 'matter', matterId]
 *   - Item individual:                    [resource, 'item', itemId]
 *
 * El handler global está montado en VoiceProvider · este hook expone API
 * para que componentes con queries personalizadas las inscriban en el bus
 * y reciban invalidaciones del agente.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  DataChangedEventDetail,
  DataChangedResource,
} from '@/lib/voice/ui-command-bus';

type QueryKeyFactory =
  | readonly unknown[]
  | ((detail: DataChangedEventDetail) => readonly unknown[]);

/**
 * Hook para registrar queryKeys que deben invalidarse cuando el agente
 * modifica determinados resources.
 *
 * Ejemplo:
 *   useDataInvalidation('invoices', ['invoices', filters]);
 *   useDataInvalidation('tasks', (detail) =>
 *     detail.matter_id
 *       ? ['tasks', 'matter', detail.matter_id]
 *       : ['tasks']
 *   );
 */
export function useDataInvalidation(
  resource: DataChangedResource | DataChangedResource[],
  keyOrFactory: QueryKeyFactory,
): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const watched: DataChangedResource[] = Array.isArray(resource)
      ? resource
      : [resource];

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<DataChangedEventDetail>).detail;
      if (!detail || typeof detail !== 'object') return;
      if (!watched.includes(detail.resource)) return;
      const queryKey =
        typeof keyOrFactory === 'function'
          ? keyOrFactory(detail)
          : keyOrFactory;
      try {
        qc.invalidateQueries({ queryKey });
      } catch {
        /* swallow */
      }
    };
    window.addEventListener('lexai:data-changed', handler);
    return () => {
      window.removeEventListener('lexai:data-changed', handler);
    };
  }, [resource, keyOrFactory, qc]);
}

/**
 * Global invalidator · MONTAR UNA SOLA VEZ (ya está en VoiceProvider).
 *
 * Invalida queries basadas en la convención canónica de queryKey para
 * cualquier resource que el agente modifique. Componentes con queryKeys
 * estándar no necesitan hacer nada extra · sus useQuery refetchean solos.
 *
 * Si un componente tiene un queryKey custom (filtros raros, paginación,
 * etc.), usa `useDataInvalidation` adicional para registrar ese key.
 */
export function useGlobalDataInvalidation(): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<DataChangedEventDetail>).detail;
      if (!detail || typeof detail !== 'object') return;
      try {
        // Invalida la lista global del resource.
        qc.invalidateQueries({ queryKey: [detail.resource] });
        // Invalida la versión filtrada por matter si aplica.
        if (detail.matter_id) {
          qc.invalidateQueries({
            queryKey: [detail.resource, 'matter', detail.matter_id],
          });
        }
      } catch {
        /* swallow · query client may not be ready */
      }
    };
    window.addEventListener('lexai:data-changed', handler);
    return () => {
      window.removeEventListener('lexai:data-changed', handler);
    };
  }, [qc]);
}
