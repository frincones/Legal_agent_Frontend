'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Lesson = {
  id: string;
  matter_id: string;
  outcome: 'won' | 'lost' | 'settled' | 'abandoned' | 'unknown';
  summary: string;
  strategy_used: string | null;
  what_worked: string | null;
  what_failed: string | null;
  key_citations: string[];
  key_arguments: string[];
  tags: string[];
  generated_by: 'manual' | 'llm' | 'llm_curated';
  embedded: boolean;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const OUTCOME_LABELS: Record<Lesson['outcome'], string> = {
  won: 'Ganado',
  lost: 'Perdido',
  settled: 'Conciliado',
  abandoned: 'Abandonado',
  unknown: 'Sin definir',
};

const OUTCOME_CHIPS: Record<Lesson['outcome'], string> = {
  won: 'chip-green',
  lost: 'chip-danger',
  settled: 'chip-blue',
  abandoned: 'chip-amber',
  unknown: 'chip-neutral',
};

export function MatterLessonsTab({ matterId }: { matterId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Lesson>>({ outcome: 'unknown' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/lessons/matter/${matterId}`, { cache: 'no-store' });
      if (r.ok) setLessons((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function extractWithLLM(force = false) {
    setExtracting(true);
    try {
      const r = await fetch('/api/lessons/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matter_id: matterId, force }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.detail || data.error || 'No se pudo extraer la lección');
        return;
      }
      if (data.status === 'already_exists') {
        if (confirm('Ya existe una lección IA · ¿Re-extraer?')) {
          await extractWithLLM(true);
        }
      } else if (data.status === 'ok') {
        toast.success('Lección extraída por IA');
        void refresh();
      }
    } finally {
      setExtracting(false);
    }
  }

  async function saveManual() {
    if (!draft.summary || !draft.summary.trim()) {
      toast.error('Escribe al menos el resumen');
      return;
    }
    const payload = {
      matter_id: matterId,
      outcome: draft.outcome || 'unknown',
      summary: draft.summary,
      strategy_used: draft.strategy_used || null,
      what_worked: draft.what_worked || null,
      what_failed: draft.what_failed || null,
      key_citations: draft.key_citations || [],
      key_arguments: draft.key_arguments || [],
      tags: draft.tags || [],
    };
    const r = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      toast.success('Lección guardada');
      setEditorOpen(false);
      setDraft({ outcome: 'unknown' });
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || data.error || 'No se pudo guardar');
    }
  }

  async function removeLesson(id: string) {
    if (!confirm('¿Eliminar lección?')) return;
    const r = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setLessons((p) => p.filter((x) => x.id !== id));
      toast.success('Lección eliminada');
    }
  }

  return (
    <section className="surface flex flex-col gap-3 p-[var(--pad-card)]">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="serif m-0 text-[16px] font-semibold">Lecciones aprendidas</h3>
          <p className="text-[12px] muted">
            Memoria del despacho · {lessons.length} {lessons.length === 1 ? 'lección' : 'lecciones'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => extractWithLLM(false)}
            disabled={extracting}
          >
            {extracting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Extraer con IA
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setDraft({ outcome: 'unknown' }); setEditorOpen(true); }}
          >
            <Plus size={14} /> Manual
          </button>
        </div>
      </header>

      {loading ? (
        <div className="py-8 text-center text-[12.5px] muted">
          <Loader2 className="mx-auto animate-spin" size={20} />
        </div>
      ) : lessons.length === 0 ? (
        <div className="grid gap-1 rounded-md border border-dashed border-line p-6 text-center">
          <BookOpen className="mx-auto text-ink-3" size={20} />
          <div className="text-[13px] font-medium">Sin lecciones todavía</div>
          <p className="mx-auto max-w-md text-[12px] muted">
            Cuando este caso cierre, la IA puede leer eventos + documentos + riesgos
            para extraer una lección útil para casos similares.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((l) => (
            <li key={l.id} className="rounded-md border border-line bg-bg-elev p-3">
              <header className="flex flex-wrap items-center gap-2">
                <span className={cn('chip', OUTCOME_CHIPS[l.outcome])}>
                  {OUTCOME_LABELS[l.outcome]}
                </span>
                <span className="chip chip-neutral">
                  {l.generated_by === 'manual'
                    ? 'Manual'
                    : l.generated_by === 'llm_curated'
                      ? 'IA · revisable'
                      : 'IA'}
                </span>
                {l.embedded && (
                  <span className="chip chip-purple">
                    <Sparkles size={9} /> RAG
                  </span>
                )}
                <span className="ml-auto text-[11px] muted">
                  {l.created_at ? formatRelative(l.created_at) : ''}
                </span>
                <button
                  className="btn btn-icon btn-ghost btn-sm"
                  onClick={() => removeLesson(l.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </header>
              <p className="mt-2 text-[13px] leading-relaxed">{l.summary}</p>
              {l.strategy_used && (
                <Field label="Estrategia">{l.strategy_used}</Field>
              )}
              {l.what_worked && (
                <Field label="Qué funcionó" tone="ok">{l.what_worked}</Field>
              )}
              {l.what_failed && (
                <Field label="Qué falló" tone="warn">{l.what_failed}</Field>
              )}
              {(l.key_citations?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {l.key_citations.map((c) => (
                    <span key={c} className="mono rounded-md bg-bg-sunken px-1.5 py-0.5 text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {(l.tags?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {l.tags.map((t) => (
                    <span key={t} className="rounded-md bg-bg-sunken px-1.5 py-0.5 text-[11px] text-ink-3">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg-overlay backdrop-blur-sm">
          <div className="mt-[8vh] w-[min(96vw,640px)] rounded-xl border border-line bg-bg shadow-2">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif text-[14px] font-semibold">Nueva lección manual</h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditorOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <select
                className="input"
                value={draft.outcome || 'unknown'}
                onChange={(ev) => setDraft((p) => ({ ...p, outcome: ev.target.value as Lesson['outcome'] }))}
              >
                {(Object.keys(OUTCOME_LABELS) as Lesson['outcome'][]).map((o) => (
                  <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>
                ))}
              </select>
              <textarea
                placeholder="Resumen · 3-5 líneas describiendo qué pasó"
                value={draft.summary || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, summary: ev.target.value }))}
                rows={4}
                className="input min-h-[80px]"
              />
              <textarea
                placeholder="Estrategia usada (opcional)"
                value={draft.strategy_used || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, strategy_used: ev.target.value }))}
                rows={2}
                className="input"
              />
              <textarea
                placeholder="Qué funcionó (opcional)"
                value={draft.what_worked || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, what_worked: ev.target.value }))}
                rows={2}
                className="input"
              />
              <textarea
                placeholder="Qué falló o pudo mejorar (opcional)"
                value={draft.what_failed || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, what_failed: ev.target.value }))}
                rows={2}
                className="input"
              />
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={saveManual}>Guardar</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label, tone, children,
}: { label: string; tone?: 'ok' | 'warn'; children: React.ReactNode }) {
  return (
    <div className="mt-2 grid grid-cols-[120px_1fr] gap-2 text-[12.5px]">
      <span
        className={cn(
          'text-[10.5px] font-semibold uppercase tracking-wider',
          tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink-3',
        )}
      >
        {label}
      </span>
      <span className="text-ink-2">{children}</span>
    </div>
  );
}
