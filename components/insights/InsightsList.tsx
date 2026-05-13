'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Info, Loader2, RefreshCcw, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Insight = {
  id: string;
  kind: string;
  severity: 'info' | 'warning' | 'critical';
  target_type: string | null;
  target_id: string | null;
  title: string;
  body: string;
  suggested_action: string | null;
  action_payload: any;
  confidence: number | null;
  status: 'new' | 'accepted' | 'dismissed' | 'expired';
  generated_by: string;
  created_at: string;
};

const SEV: Record<Insight['severity'], { cls: string; icon: JSX.Element }> = {
  critical: { cls: 'border-red-500/40 text-red-500', icon: <AlertTriangle size={12} aria-hidden="true" /> },
  warning: { cls: 'border-amber-500/40 text-amber-500', icon: <AlertTriangle size={12} aria-hidden="true" /> },
  info: { cls: 'border-blue-500/40 text-blue-500', icon: <Info size={12} aria-hidden="true" /> },
};

const KIND_LABEL: Record<string, string> = {
  deadline_unprep: 'Plazo sin preparar',
  matter_at_risk: 'Caso en riesgo',
  high_value_client_inactive: 'Cliente VIP inactivo',
  billing_opportunity: 'Horas por facturar',
  lead_followup_overdue: 'Lead sin seguimiento',
  outdated_citation: 'Cita desactualizada',
  document_missing: 'Documento faltante',
  missing_party: 'Parte faltante',
};

export function InsightsList({ compact = false, maxItems }: { compact?: boolean; maxItems?: number }) {
  const [items, setItems] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | Insight['severity']>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/insights?status=new&limit=50', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function regenerate() {
    setRefreshing(true);
    try {
      const r = await fetch('/api/insights/refresh', { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Regenerado · ${d.inserted ?? 0} nuevos`);
      await refresh();
    } catch {
      toast.error('Error');
    } finally {
      setRefreshing(false);
    }
  }

  async function accept(id: string) {
    const r = await fetch(`/api/insights/${id}/accept`, { method: 'POST' });
    if (r.ok) { toast.success('Aceptado'); void refresh(); }
  }

  async function dismiss(id: string) {
    const r = await fetch(`/api/insights/${id}/dismiss`, { method: 'POST' });
    if (r.ok) void refresh();
  }

  const visible = items.filter((it) => filter === 'all' || it.severity === filter);
  const sliced = maxItems ? visible.slice(0, maxItems) : visible;

  return (
    <div className="grid gap-3">
      {!compact && (
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="serif text-[16px] font-semibold">Sugerencias de LexAI</h2>
            <p className="text-[12px] muted">Acciones proactivas basadas en el estado de tu firma.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border border-line p-0.5">
              {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded px-2 py-1 text-[11.5px] font-medium',
                    filter === f ? 'bg-accent text-white' : 'text-ink-2',
                  )}
                >
                  {f === 'all' ? 'Todo' : f === 'critical' ? 'Crítico' : f === 'warning' ? 'Atención' : 'Info'}
                </button>
              ))}
            </div>
            <button className="btn" onClick={regenerate} disabled={refreshing}>
              {refreshing ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <RefreshCcw size={12} aria-hidden="true" />}
              Regenerar
            </button>
          </div>
        </header>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : sliced.length === 0 ? (
        <div className="surface p-6 text-center muted text-[12.5px]">
          <Sparkles size={20} className="mx-auto text-accent mb-2" aria-hidden="true" />
          Sin sugerencias pendientes. {compact ? '' : 'Pulsa "Regenerar" para analizar el estado actual de la firma.'}
        </div>
      ) : (
        sliced.map((it) => {
          const sev = SEV[it.severity];
          const nav = it.action_payload?.navigate as string | undefined;
          return (
            <article key={it.id} className="surface flex items-start gap-3 p-3">
              <span className={cn('inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10.5px] font-semibold', sev.cls)}>
                {sev.icon}
                {it.severity}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-[13px]">{it.title}</strong>
                  <span className="text-[10.5px] muted">· {KIND_LABEL[it.kind] || it.kind}</span>
                  {it.confidence !== null && (
                    <span className="text-[10.5px] muted">· {Math.round((it.confidence ?? 0) * 100)}%</span>
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] muted">{it.body}</p>
                {it.suggested_action && (
                  <p className="mt-1 text-[12px] text-accent">→ {it.suggested_action}</p>
                )}
              </div>
              <div className="flex flex-none gap-1">
                {nav && (
                  <Link href={nav} className="btn">Ver</Link>
                )}
                <button className="btn" onClick={() => accept(it.id)} title="Marcar como atendido">
                  <CheckCircle2 size={12} className="text-emerald-500" aria-hidden="true" />
                </button>
                <button className="btn" onClick={() => dismiss(it.id)} title="Descartar">
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
