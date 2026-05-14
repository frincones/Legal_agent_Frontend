'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type SimilarLesson = {
  matter_id: string;
  lesson_id: string;
  outcome: string;
  similarity: number;
  titulo: string;
  summary: string;
};

type Prediction = {
  id: string;
  matter_id: string | null;
  prob_won: number;
  prob_lost: number;
  prob_settled: number;
  prob_abandoned: number;
  confidence: number;
  primary_outcome: 'won' | 'lost' | 'settled' | 'abandoned' | 'unknown';
  summary: string | null;
  recommended_strategy: string | null;
  risks: string[];
  similar_lessons: SimilarLesson[];
  generated_at: string | null;
  generated_by: string | null;
  reviewed_at: string | null;
};

const OUTCOME_LABELS: Record<Prediction['primary_outcome'], string> = {
  won: 'Probablemente favorable',
  lost: 'Probablemente desfavorable',
  settled: 'Probable conciliación',
  abandoned: 'Probable abandono',
  unknown: 'Sin datos suficientes',
};

const OUTCOME_COLORS: Record<Prediction['primary_outcome'], string> = {
  won: 'text-ok',
  lost: 'text-danger',
  settled: 'text-accent',
  abandoned: 'text-warn',
  unknown: 'text-ink-3',
};

export function MatterPredictionCard({ matterId }: { matterId: string }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/predictions/matter/${matterId}/latest`, { cache: 'no-store' });
      if (r.ok) {
        const text = await r.text();
        setPrediction(text && text !== 'null' ? JSON.parse(text) : null);
      }
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function generate() {
    setGenerating(true);
    try {
      const r = await fetch(`/api/predictions/matter/${matterId}/generate`, { method: 'POST' });
      if (r.ok) {
        toast.success('Predicción IA generada');
        void refresh();
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.detail || data.error || 'No se pudo generar');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function markReviewed() {
    if (!prediction) return;
    setReviewing(true);
    try {
      const r = await fetch(`/api/predictions/${prediction.id}/review`, { method: 'POST' });
      if (r.ok) {
        toast.success('Marcada como revisada');
        void refresh();
      }
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <section className="surface p-[var(--pad-card)]">
        <div className="flex items-center gap-2 text-[12.5px] muted">
          <Loader2 className="animate-spin" size={14} />
          Cargando predicción…
        </div>
      </section>
    );
  }

  if (!prediction) {
    return (
      <section className="surface p-[var(--pad-card)]">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-soft text-accent">
            <TrendingUp size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="serif m-0 text-[15px] font-semibold">Predicción IA del caso</h3>
            <p className="mt-1 text-[12px] muted">
              Aún no hay un pronóstico. La IA usa los riesgos, documentos y casos similares de tu despacho
              para estimar la probabilidad de cada outcome.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={generate}
            disabled={generating}
          >
            {generating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            {generating ? 'Generando…' : 'Generar predicción'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="surface p-[var(--pad-card)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-soft text-accent">
            <TrendingUp size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="serif m-0 text-[15px] font-semibold">Predicción IA</h3>
            <p className="text-[11px] muted">
              {prediction.generated_at ? formatRelative(prediction.generated_at) : '—'}
              {prediction.generated_by === 'llm' && ' · gpt-4o-mini'}
              {prediction.reviewed_at && (
                <span className="ml-1 inline-flex items-center gap-1 text-ok">
                  · <CheckCircle2 size={10} /> revisada
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!prediction.reviewed_at && (
            <button className="btn btn-ghost btn-sm" onClick={markReviewed} disabled={reviewing}>
              <CheckCircle2 size={12} /> Marcar revisada
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
            Re-generar
          </button>
        </div>
      </header>

      {/* Outcome principal + confidence */}
      <div className="mt-3 flex items-baseline justify-between gap-3 rounded-md bg-bg-sunken px-3 py-2">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Outcome estimado
          </div>
          <div className={cn('serif text-[18px] font-semibold leading-tight', OUTCOME_COLORS[prediction.primary_outcome])}>
            {OUTCOME_LABELS[prediction.primary_outcome]}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Confianza
          </div>
          <div className="serif tabular text-[18px] font-semibold">
            {Math.round(prediction.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Barras de probabilidad */}
      <div className="mt-3 grid gap-1">
        <ProbBar label="Ganado" value={prediction.prob_won} color="bg-ok" />
        <ProbBar label="Conciliado" value={prediction.prob_settled} color="bg-accent" />
        <ProbBar label="Perdido" value={prediction.prob_lost} color="bg-danger" />
        <ProbBar label="Abandonado" value={prediction.prob_abandoned} color="bg-warn" />
      </div>

      {/* Resumen */}
      {prediction.summary && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">{prediction.summary}</p>
      )}

      {/* Estrategia recomendada */}
      {prediction.recommended_strategy && (
        <div className="mt-3 rounded-md border-l-2 border-accent bg-accent-soft p-2.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-accent">
            Recomendación
          </div>
          <p className="mt-0.5 text-[12.5px] leading-relaxed">
            {prediction.recommended_strategy}
          </p>
        </div>
      )}

      {/* Top riesgos */}
      {prediction.risks?.length > 0 && (
        <div className="mt-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Riesgos clave
          </div>
          <ul className="mt-1 flex flex-col gap-1">
            {prediction.risks.slice(0, 5).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-ink-2">
                <span className="mt-1 inline-block h-1 w-1 flex-none rounded-full bg-warn" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Casos similares */}
      {prediction.similar_lessons?.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Casos previos similares en el despacho
          </div>
          <ul className="flex flex-col gap-1">
            {prediction.similar_lessons.slice(0, 4).map((s) => (
              <li key={s.lesson_id} className="flex items-baseline gap-2 text-[12px]">
                <span className={cn('chip text-[10px]',
                  s.outcome === 'won' ? 'chip-green'
                  : s.outcome === 'lost' ? 'chip-danger'
                  : s.outcome === 'settled' ? 'chip-blue'
                  : 'chip-neutral',
                )}>
                  {s.outcome === 'won' ? 'Ganado'
                   : s.outcome === 'lost' ? 'Perdido'
                   : s.outcome === 'settled' ? 'Conciliado'
                   : s.outcome === 'abandoned' ? 'Abandonado'
                   : 'Sin datos'}
                </span>
                <Link href={`/casos/${s.matter_id}`} className="text-accent hover:underline truncate">
                  {s.titulo}
                </Link>
                <span className="ml-auto text-[10.5px] muted">
                  sim {Math.round(s.similarity * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-2 text-[11.5px]">
      <span className="w-[80px] flex-none text-ink-3">{label}</span>
      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-bg-sunken">
        <span className={cn('block h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular w-[36px] flex-none text-right text-ink-2">{pct}%</span>
    </div>
  );
}
