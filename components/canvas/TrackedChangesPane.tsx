'use client';

/**
 * Sprint E · TrackedChangesPane
 *
 * Sidebar derecho del Canvas con redlines pendientes/aplicados.
 * Suscripción Realtime a canvas_redlines · refresh sin polling.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';
import { RedlineCard, type Redline } from './RedlineCard';

type RedlineSet = {
  id: string;
  matter_id: string | null;
  document_id: string | null;
  redlines: Redline[];
  original_text: string;
  result_text: string | null;
  status: 'pending' | 'applied' | 'rejected' | 'superseded';
  applied_count: number;
  rejected_count: number;
  created_at: string;
  applied_at: string | null;
};

export function TrackedChangesPane({
  matterId,
  documentId,
  onApplied,
}: {
  matterId?: string;
  documentId?: string;
  onApplied?: (resultText: string) => void;
}) {
  const [sets, setSets] = useState<RedlineSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState<Record<string, Set<string>>>({});
  const [rejected, setRejected] = useState<Record<string, Set<string>>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!matterId && !documentId) {
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (documentId) params.set('document_id', documentId);
      else if (matterId) params.set('matter_id', matterId);
      const r = await fetch(`/api/canvas/redlines?${params}`, { cache: 'no-store' });
      if (r.ok) setSets(await r.json());
    } finally {
      setLoading(false);
    }
  }, [matterId, documentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!matterId && !documentId) return;
    const supabase = createClient();
    const filter = documentId
      ? `document_id=eq.${documentId}`
      : `matter_id=eq.${matterId}`;
    const channel = supabase
      .channel(`canvas_redlines_${documentId || matterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canvas_redlines', filter },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matterId, documentId, refresh]);

  function toggleAccept(setId: string, redlineId: string) {
    setAccepted(prev => {
      const next = { ...prev };
      const s = new Set(next[setId] || []);
      if (s.has(redlineId)) s.delete(redlineId);
      else s.add(redlineId);
      next[setId] = s;
      return next;
    });
    setRejected(prev => {
      const next = { ...prev };
      const s = new Set(next[setId] || []);
      s.delete(redlineId);
      next[setId] = s;
      return next;
    });
  }

  function toggleReject(setId: string, redlineId: string) {
    setRejected(prev => {
      const next = { ...prev };
      const s = new Set(next[setId] || []);
      if (s.has(redlineId)) s.delete(redlineId);
      else s.add(redlineId);
      next[setId] = s;
      return next;
    });
    setAccepted(prev => {
      const next = { ...prev };
      const s = new Set(next[setId] || []);
      s.delete(redlineId);
      next[setId] = s;
      return next;
    });
  }

  async function applySet(set: RedlineSet) {
    setSubmitting(set.id);
    try {
      const accept = Array.from(accepted[set.id] || []);
      const reject = Array.from(rejected[set.id] || []);
      const r = await fetch(`/api/canvas/redlines/${set.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept_ids: accept, reject_ids: reject }),
      });
      if (!r.ok) {
        toast.error(`Error ${r.status}`);
        return;
      }
      const data = await r.json();
      toast.success(`Aplicados ${data.applied_count} redlines`);
      onApplied?.(data.result_text);
      void refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setSubmitting(null);
    }
  }

  async function rejectAll(set: RedlineSet) {
    if (!confirm(`¿Rechazar todos los ${set.redlines.length} redlines?`)) return;
    setSubmitting(set.id);
    try {
      const r = await fetch(`/api/canvas/redlines/${set.id}/reject-all`, {
        method: 'POST',
      });
      if (r.ok) {
        toast.success('Todos los redlines rechazados');
        void refresh();
      }
    } finally {
      setSubmitting(null);
    }
  }

  function acceptAll(set: RedlineSet) {
    const all = new Set(set.redlines.map(r => r.id));
    setAccepted(prev => ({ ...prev, [set.id]: all }));
    setRejected(prev => ({ ...prev, [set.id]: new Set() }));
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center gap-2 text-[12px] muted">
        <Loader2 size={14} className="animate-spin" /> Cargando redlines…
      </div>
    );
  }

  const pendingSets = sets.filter(s => s.status === 'pending');
  if (pendingSets.length === 0) {
    return (
      <div className="p-6 text-center">
        <ListChecks className="mx-auto h-8 w-8 text-ink-3 mb-2" />
        <h4 className="serif text-[13px] font-semibold">Sin redlines pendientes</h4>
        <p className="text-[11.5px] muted mt-1">
          Los redlines aparecerán aquí cuando una skill (/revisar/contrato, etc.) los genere.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex-none">
        <h3 className="serif text-[14px] font-semibold flex items-center gap-2">
          <ListChecks size={14} />
          Redlines pendientes
        </h3>
        <p className="text-[11px] muted mt-0.5">
          {pendingSets.length} set{pendingSets.length !== 1 ? 's' : ''} · acepta/rechaza individualmente
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {pendingSets.map(set => {
          const acceptedCount = accepted[set.id]?.size || 0;
          const rejectedCount = rejected[set.id]?.size || 0;
          return (
            <div key={set.id} className="space-y-2">
              <div className="flex items-center justify-between text-[11px] muted">
                <span>
                  {set.redlines.length} cambio{set.redlines.length !== 1 ? 's' : ''} · {formatRelative(set.created_at)}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => acceptAll(set)}
                    className="btn btn-sm text-[10px]"
                    title="Marcar todos como aceptados"
                  >
                    <Check size={10} /> Todos
                  </button>
                </div>
              </div>

              {set.redlines.map(rl => (
                <RedlineCard
                  key={rl.id}
                  redline={{
                    ...rl,
                    status: accepted[set.id]?.has(rl.id)
                      ? 'accepted'
                      : rejected[set.id]?.has(rl.id)
                        ? 'rejected'
                        : 'pending',
                  }}
                  onAccept={() => toggleAccept(set.id, rl.id)}
                  onReject={() => toggleReject(set.id, rl.id)}
                />
              ))}

              <div className="flex gap-1 pt-2 border-t">
                <button
                  type="button"
                  disabled={submitting === set.id}
                  onClick={() => applySet(set)}
                  className="btn btn-primary btn-sm flex-1"
                >
                  {submitting === set.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>Aplicar ({acceptedCount}/{set.redlines.length})</>
                  )}
                </button>
                <button
                  type="button"
                  disabled={submitting === set.id}
                  onClick={() => rejectAll(set)}
                  className="btn btn-sm"
                >
                  <X size={12} /> Rechazar todo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
