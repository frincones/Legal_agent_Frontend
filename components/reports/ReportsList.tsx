'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, Pin, Play, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Report = {
  id: string;
  name: string;
  description: string | null;
  scope: 'revenue' | 'performance' | 'pipeline' | 'predictions' | 'matters' | 'time' | 'custom';
  config: Record<string, unknown>;
  shared_with_firm: boolean;
  pinned: boolean;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const SCOPE_LABEL: Record<string, string> = {
  revenue: 'Revenue (mensual)',
  performance: 'Performance abogados',
  pipeline: 'Funnel leads → casos',
  predictions: 'Accuracy IA',
  matters: 'Casos por materia/estado',
  time: 'Horas por abogado',
  custom: 'Custom',
};

export function ReportsList({ className }: { className?: string }) {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Report>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ id: string; rows: number; ms: number } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/reports', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save() {
    if (!draft.name || !draft.name.trim() || !draft.scope) {
      toast.error('Necesitas nombre y tipo');
      return;
    }
    const payload = {
      name: draft.name.trim(),
      description: draft.description || null,
      scope: draft.scope,
      config: draft.config || { period_days: 30, months: 12 },
      shared_with_firm: !!draft.shared_with_firm,
      pinned: !!draft.pinned,
    };
    const r = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      toast.success('Report guardado');
      setEditorOpen(false); setDraft({});
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || data.error || 'No se pudo guardar');
    }
  }

  async function run(id: string) {
    setRunning(id);
    setLastResult(null);
    try {
      const r = await fetch(`/api/reports/${id}/run`, { method: 'POST' });
      if (r.ok) {
        const data = await r.json();
        setLastResult({ id, rows: data.row_count ?? 0, ms: data.duration_ms ?? 0 });
        toast.success(`Ejecutado · ${data.row_count ?? 0} filas en ${data.duration_ms ?? 0} ms`);
      } else {
        toast.error('Fallo al ejecutar');
      }
    } finally {
      setRunning(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar report?')) return;
    const r = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems((p) => p.filter((x) => x.id !== id));
      toast.success('Report eliminado');
    }
  }

  function openCreate() {
    setDraft({ scope: 'revenue', config: { months: 12, period_days: 30 } });
    setEditorOpen(true);
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <header className="flex items-center justify-between">
        <div>
          <h3 className="serif m-0 text-[14.5px] font-semibold">Reports guardados</h3>
          <p className="text-[11.5px] muted">
            Configura una vez · ejecuta cuando quieras · comparte con el despacho.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} /> Nuevo report
        </button>
      </header>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={20} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-8 text-center">
          <BarChart3 className="mx-auto text-ink-3" size={20} />
          <div className="mt-1 text-[13px] font-medium">Sin reports guardados aún</div>
          <p className="mx-auto mt-1 max-w-md text-[12px] muted">
            Guarda combinaciones de métricas + filtros + período para no reconfigurar cada vez.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((r) => (
            <li key={r.id} className="flex items-start gap-2 rounded-md border border-line bg-bg-elev px-3 py-2">
              <BarChart3 size={14} className="mt-0.5 flex-none text-accent" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[13px] font-semibold">{r.name}</span>
                  {r.pinned && <Pin size={10} className="text-accent" />}
                  <span className="chip chip-neutral text-[10px]">{SCOPE_LABEL[r.scope] || r.scope}</span>
                  {r.shared_with_firm && <span className="chip chip-blue text-[10px]">compartido</span>}
                  {lastResult?.id === r.id && (
                    <span className="ml-auto text-[10.5px] text-ok">
                      ✓ {lastResult.rows} filas en {lastResult.ms} ms
                    </span>
                  )}
                </div>
                {r.description && <p className="text-[11.5px] muted">{r.description}</p>}
                <div className="text-[10.5px] text-ink-3">
                  Actualizado {r.updated_at ? formatRelative(r.updated_at) : '—'}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => run(r.id)}
                disabled={running === r.id}
              >
                {running === r.id ? <Loader2 className="animate-spin" size={12} /> : <Play size={12} />}
                Ejecutar
              </button>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => remove(r.id)} aria-label="Eliminar">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg-overlay backdrop-blur-sm">
          <div className="mt-[12vh] w-[min(96vw,520px)] rounded-xl border border-line bg-bg shadow-2">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif text-[14px] font-semibold">Nuevo report</h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditorOpen(false)} aria-label="Cerrar">
                <X size={14} />
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <input
                placeholder="Nombre · ej: 'Revenue Q1 2026'"
                value={draft.name || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, name: ev.target.value }))}
                className="input"
                autoFocus
              />
              <textarea
                placeholder="Descripción (opcional)"
                rows={2}
                value={draft.description || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, description: ev.target.value }))}
                className="input min-h-[60px]"
              />
              <div>
                <label className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                  Tipo de report
                </label>
                <select
                  className="input mt-1"
                  value={draft.scope || 'revenue'}
                  onChange={(ev) => setDraft((p) => ({ ...p, scope: ev.target.value as Report['scope'] }))}
                >
                  {Object.entries(SCOPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                    Período (días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={(draft.config as any)?.period_days ?? 30}
                    onChange={(ev) => setDraft((p) => ({
                      ...p, config: { ...(p.config as any), period_days: parseInt(ev.target.value) },
                    }))}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                    Meses (revenue)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={(draft.config as any)?.months ?? 12}
                    onChange={(ev) => setDraft((p) => ({
                      ...p, config: { ...(p.config as any), months: parseInt(ev.target.value) },
                    }))}
                    className="input mt-1"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-[12.5px]">
                  <input type="checkbox" checked={!!draft.shared_with_firm}
                    onChange={(ev) => setDraft((p) => ({ ...p, shared_with_firm: ev.target.checked }))} />
                  Compartir con todo el despacho
                </label>
                <label className="flex items-center gap-2 text-[12.5px]">
                  <input type="checkbox" checked={!!draft.pinned}
                    onChange={(ev) => setDraft((p) => ({ ...p, pinned: ev.target.checked }))} />
                  Pinear
                </label>
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={save}>Guardar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
