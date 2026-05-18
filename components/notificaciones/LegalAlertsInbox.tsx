'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BellOff, Check, ExternalLink, Info, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';
import { useDataChangeRefresh } from '@/lib/hooks/useDataChangeRefresh';

type LegalAlert = {
  id: string;
  target_type: string;
  target_ref: string;
  kind: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string | null;
  source_url: string | null;
  source: string;
  affected_matter_ids: string[];
  affected_document_ids: string[];
  detected_at: string;
  read_at: string | null;
  dismissed_at: string | null;
};

const KIND_LABEL: Record<string, string> = {
  derogada: 'Derogada',
  modificada: 'Modificada',
  nueva_jurisprudencia: 'Nueva jurisprudencia',
  cambio_normativo: 'Cambio normativo',
  sentencia_relevante: 'Sentencia relevante',
  suspendida: 'Suspendida',
};

export function LegalAlertsInbox() {
  const [items, setItems] = useState<LegalAlert[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/legal-alerts', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setItems((await res.json()) as LegalAlert[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Refresca alertas legales cuando el agente regenera insights.
  useDataChangeRefresh('insights', load);

  const handleRead = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/legal-alerts/${encodeURIComponent(id)}/read`, { method: 'POST' });
        if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
        setItems((cur) =>
          cur ? cur.map((a) => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a)) : cur,
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const handleDismiss = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/legal-alerts/${encodeURIComponent(id)}/dismiss`, { method: 'POST' });
        if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
        setItems((cur) => (cur ? cur.filter((a) => a.id !== id) : cur));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  if (loading && !items) {
    return (
      <div className="surface flex items-center gap-2 p-6 muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        Cargando alertas legislativas…
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="surface flex items-center gap-3 p-6 muted">
        <BellOff size={16} className="flex-none" aria-hidden="true" />
        <div>
          <div className="text-[13px] font-medium text-ink">Sin alertas legislativas</div>
          <p className="mt-1 text-[12px]">
            Cuando una norma o jurisprudencia que usas cambie, te avisaremos aquí. El watcher
            automático del Diario Oficial / Corte Constitucional / Senado entra en línea en
            Sprint 12 (M24).
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((a) => {
        const sev = a.severity;
        const Icon = sev === 'critical' ? AlertTriangle : sev === 'warning' ? AlertTriangle : Sparkles;
        return (
          <li
            key={a.id}
            className={cn(
              'rounded-lg border p-3',
              sev === 'critical' && 'border-red-500/40 bg-red-500/5',
              sev === 'warning' && 'border-amber-500/40 bg-amber-500/5',
              sev === 'info' && 'border-line bg-bg-elev',
              !a.read_at && 'shadow-1',
            )}
          >
            <div className="flex items-start gap-3">
              <Icon
                size={16}
                className={cn(
                  'mt-0.5 flex-none',
                  sev === 'critical' && 'text-red-500',
                  sev === 'warning' && 'text-amber-500',
                  sev === 'info' && 'text-accent',
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold">{a.title}</span>
                  <span className="chip">{KIND_LABEL[a.kind] ?? a.kind}</span>
                  {!a.read_at && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-accent" aria-label="Sin leer" />
                  )}
                </div>
                <div className="mt-1 text-[11.5px] muted">
                  <code className="mono">{a.target_ref}</code> · {formatRelative(a.detected_at)} · fuente {a.source}
                </div>
                {a.description && (
                  <p className="mt-2 text-[12.5px] text-ink-2">{a.description}</p>
                )}
                {a.affected_matter_ids.length > 0 && (
                  <div className="mt-2 text-[11.5px] muted">
                    Afecta {a.affected_matter_ids.length} caso
                    {a.affected_matter_ids.length === 1 ? '' : 's'}.
                  </div>
                )}
                {a.source_url && (
                  <a
                    href={a.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-accent hover:underline"
                  >
                    Ver fuente <ExternalLink size={11} aria-hidden="true" />
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {!a.read_at && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void handleRead(a.id)}
                    title="Marcar como leído"
                  >
                    <Check size={11} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void handleDismiss(a.id)}
                  title="Descartar"
                >
                  <BellOff size={11} aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
