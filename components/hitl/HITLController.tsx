'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { HITLGate, type HITLKind } from '@/components/hitl/HITLGate';

type Pending = {
  id: string;
  kind: HITLKind;
  payload: Record<string, unknown>;
  created_at: string;
  matter_id: string | null;
};

/**
 * Global HITL controller · listens for new hitl_interrupts via Supabase
 * Realtime + initial fetch of currently pending. Renders modal queue.
 *
 * Decisions PATCH /api/hitl/{id}/decide which proxies to Railway.
 */
export function HITLController() {
  const [queue, setQueue] = useState<Pending[]>([]);
  const [active, setActive] = useState<Pending | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    void (async () => {
      const { data } = await supabase
        .from('hitl_interrupts')
        .select('id, kind, payload, created_at, matter_id')
        .eq('decision', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      const rows = (data ?? []) as unknown as Pending[];
      setQueue(rows);
      if (rows.length > 0 && !active) setActive(rows[0]!);
    })();

    // Realtime subscription
    const channel = supabase
      .channel('hitl-pending')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hitl_interrupts' },
        (payload) => {
          const row = payload.new as Pending;
          if ((row as unknown as { decision?: string }).decision !== 'pending') return;
          setQueue((q) => [row, ...q]);
          setActive((cur) => cur ?? row);
          toast.message(`Acción HITL pendiente: ${row.kind}`, { duration: 4000 });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active]);

  const close = () => setActive(null);
  const advance = () => {
    setQueue((q) => q.slice(1));
    setActive(queue[1] ?? null);
  };

  const decide = async (decision: 'approved' | 'edited' | 'rejected', editedPayload?: unknown) => {
    if (!active) return;
    try {
      const res = await fetch(`/api/hitl/${active.id}/decide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, decision_payload: editedPayload }),
      });
      if (!res.ok) throw new Error('No se pudo registrar la decisión');
      toast.success(
        decision === 'approved' ? 'Aprobado' : decision === 'edited' ? 'Editado y aprobado' : 'Rechazado',
      );
      advance();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  if (!active) return null;
  return (
    <HITLGate
      open={true}
      kind={active.kind}
      preview={active.payload}
      onApprove={() => decide('approved')}
      onEdit={() => decide('edited')}
      onReject={() => decide('rejected')}
      onClose={close}
    />
  );
}
