'use client';

/**
 * useTableSubscription · Capa 3 de la sincronización agente↔UI.
 *
 * Suscribe el componente a cambios Realtime de una tabla Supabase para una
 * firma (multi-tenant) y opcionalmente filtrado por matter_id. Cuando llega
 * un evento INSERT/UPDATE/DELETE dispara la `onChange` que recibió.
 *
 * Cubre el caso edge que Capa 1 (data_changed via bus) no resuelve: cambios
 * hechos por OTRO usuario del despacho (colaboración real), webhooks externos
 * (DocuSign), o workers backend (judicial_poller, sla_reminders, insights).
 *
 * Uso (mismo patrón que useDataChangeRefresh):
 *
 *   useTableSubscription('matter_deadlines', refresh, { matterId });
 *
 * Requiere que la tabla esté añadida a la publication `supabase_realtime`
 * (lo hace la migración `2026_05_18_realtime_publication.sql`). RLS aplica
 * normalmente, así que el browser solo recibe rows que el usuario puede ver.
 */

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type ChangeFn = () => void | Promise<void>;

const SUBSCRIBABLE_TABLES = [
  'matter_deadlines',
  'matter_notes',
  'tasks',
  'matter_documents',
  'matter_parties',
  'comments',
  'time_entries',
  'expenses',
  'invoices',
  'trust_transactions',
  'leads',
  'case_lessons',
  'case_predictions',
  'knowledge_entries',
  'signature_envelopes',
  'judicial_notifications',
  'legal_alerts',
  'ai_insights',
  'matters',
] as const;

export type SubscribableTable = (typeof SUBSCRIBABLE_TABLES)[number];

export interface UseTableSubscriptionOptions {
  /** Cuando se pasa, solo dispara onChange si el row tiene este matter_id. */
  matterId?: string | null;
  /** Throttle entre invocaciones de onChange · default 350ms. */
  throttleMs?: number;
  /** Eventos a escuchar · default ['INSERT', 'UPDATE', 'DELETE']. */
  events?: Array<'INSERT' | 'UPDATE' | 'DELETE'>;
}

export function useTableSubscription(
  table: SubscribableTable,
  onChange: ChangeFn,
  options: UseTableSubscriptionOptions = {},
): void {
  const matterId = options.matterId ?? undefined;
  const throttleMs = options.throttleMs ?? 350;
  const events = options.events ?? ['INSERT', 'UPDATE', 'DELETE'];
  const lastFiredRef = useRef<number>(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supabase = createClient();
    const channelName = `lexai:${table}:${matterId ?? 'firm'}`;

    const fire = () => {
      const now = Date.now();
      if (now - lastFiredRef.current < throttleMs) return;
      lastFiredRef.current = now;
      try {
        const out = onChangeRef.current();
        if (out && typeof (out as Promise<void>).then === 'function') {
          (out as Promise<void>).catch(() => {
            /* swallow */
          });
        }
      } catch {
        /* swallow */
      }
    };

    const channel = supabase.channel(channelName);
    for (const ev of events) {
      const filter: { event: typeof ev; schema: string; table: string; filter?: string } = {
        event: ev,
        schema: 'public',
        table,
      };
      if (matterId) filter.filter = `matter_id=eq.${matterId}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (channel as any).on('postgres_changes', filter, () => {
        fire();
      });
    }

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[useTableSubscription] ${table} channel ${status}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, matterId, throttleMs, events]);
}
