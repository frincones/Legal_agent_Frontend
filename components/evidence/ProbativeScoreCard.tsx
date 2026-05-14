'use client';

import { CheckCircle2, Gauge, Lightbulb, MinusCircle, PlusCircle } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';

export type Factor = {
  factor: string;
  weight: number;
  note: string;
};

export type ProbativeScore = {
  id: string;
  probative_score: number;
  level: 'fuerte' | 'medio' | 'debil' | 'cuestionable';
  summary: string;
  positive_factors: Factor[];
  negative_factors: Factor[];
  recommendations: string[];
  validation_id: string | null;
  inconsistency_id: string | null;
  computed_at: string;
  reviewed_at: string | null;
};

const LEVEL_TONE = {
  fuerte: { color: 'text-ok', bg: 'bg-ok-soft', label: 'Fuerte' },
  medio: { color: 'text-accent', bg: 'bg-accent-soft', label: 'Media' },
  debil: { color: 'text-warn', bg: 'bg-warn-soft', label: 'Débil' },
  cuestionable: { color: 'text-danger', bg: 'bg-danger-soft', label: 'Cuestionable' },
} as const;

export function ProbativeScoreCard({
  score,
  className,
}: {
  score: ProbativeScore;
  className?: string;
}) {
  const tone = LEVEL_TONE[score.level];
  const pct = Math.max(0, Math.min(100, score.probative_score));

  return (
    <section className={cn('surface p-[var(--pad-card)]', className)}>
      <header className="flex items-start gap-3">
        <span className={cn('grid h-10 w-10 flex-none place-items-center rounded-full', tone.bg, tone.color)}>
          <Gauge size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="serif m-0 text-[15px] font-semibold">Fortaleza probatoria</h3>
          <p className="text-[11px] muted">
            {score.computed_at ? formatRelative(score.computed_at) : '—'}
            {score.reviewed_at && <span className="text-ok"> · revisada ✓</span>}
          </p>
        </div>
      </header>

      {/* Score circle + level */}
      <div className={cn('mt-3 flex items-center justify-between gap-3 rounded-md px-3 py-3', tone.bg)}>
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Nivel</div>
          <div className={cn('serif text-[22px] font-semibold leading-tight', tone.color)}>
            Evidencia {tone.label}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Score</div>
          <div className="serif tabular text-[28px] font-semibold leading-none">{pct}<span className="text-[14px] muted">/100</span></div>
        </div>
      </div>

      {/* Bar */}
      <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-bg-sunken">
        <div
          className={cn(
            'h-full rounded-full',
            score.level === 'fuerte' && 'bg-ok',
            score.level === 'medio' && 'bg-accent',
            score.level === 'debil' && 'bg-warn',
            score.level === 'cuestionable' && 'bg-danger',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed">{score.summary}</p>

      {/* Positive factors */}
      {score.positive_factors.length > 0 && (
        <div className="mt-3">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ok">
            <PlusCircle size={11} /> Factores a favor
          </h4>
          <ul className="flex flex-col gap-1">
            {score.positive_factors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 rounded-md bg-bg-elev px-2 py-1.5">
                <span className="mt-0.5 inline-flex h-4 w-12 flex-none items-center justify-center rounded bg-ok-soft text-[10px] font-semibold text-ok">
                  +{f.weight}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium">{f.factor}</div>
                  {f.note && <div className="text-[11px] text-ink-3">{f.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative factors */}
      {score.negative_factors.length > 0 && (
        <div className="mt-3">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-warn">
            <MinusCircle size={11} /> Factores en contra
          </h4>
          <ul className="flex flex-col gap-1">
            {score.negative_factors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 rounded-md bg-bg-elev px-2 py-1.5">
                <span className="mt-0.5 inline-flex h-4 w-12 flex-none items-center justify-center rounded bg-warn-soft text-[10px] font-semibold text-warn">
                  {f.weight}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium">{f.factor}</div>
                  {f.note && <div className="text-[11px] text-ink-3">{f.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="mt-3 rounded-md border-l-2 border-accent bg-accent-soft p-2.5">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">
            <Lightbulb size={11} /> Recomendaciones
          </h4>
          <ul className="flex flex-col gap-1 text-[12px]">
            {score.recommendations.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] muted">
        Score calculado con heurísticas + IA · siempre revisa con criterio profesional antes
        de presentar evidencia al juez.
      </p>
    </section>
  );
}
