'use client';

import { AlertTriangle, ArrowRight, CheckCircle2, FileWarning, Lightbulb, Scale, Sparkles } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';

export type SimulationResult = {
  id: string;
  judge_id: string | null;
  judge_name?: string | null;
  alignment_score: number;
  reception: 'favorable' | 'mixto' | 'desfavorable' | 'incierto';
  summary: string;
  strengths: string[];
  risk_factors: string[];
  suggested_revisions: string[];
  similar_decisions: Array<{
    numero: string;
    fecha: string;
    outcome: string;
    relevance: number;
  }>;
  generated_at: string | null;
  cached?: boolean;
};

const RECEPTION_TONE: Record<SimulationResult['reception'], { color: string; label: string; bg: string }> = {
  favorable: { color: 'text-ok', label: 'Recepción favorable esperada', bg: 'bg-ok-soft' },
  mixto: { color: 'text-accent', label: 'Recepción mixta', bg: 'bg-accent-soft' },
  desfavorable: { color: 'text-danger', label: 'Recepción desfavorable esperada', bg: 'bg-danger-soft' },
  incierto: { color: 'text-warn', label: 'Recepción incierta · poca evidencia', bg: 'bg-warn-soft' },
};

export function JudgeSimulationResult({ result, className }: { result: SimulationResult; className?: string }) {
  const tone = RECEPTION_TONE[result.reception];
  const scorePct = Math.round(result.alignment_score * 100);

  return (
    <section className={cn('surface p-[var(--pad-card)]', className)}>
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent-soft text-accent">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="serif m-0 text-[16px] font-semibold">
            Predicción de recepción
            {result.judge_name && (
              <span className="ml-1 text-ink-3 font-normal">· {result.judge_name}</span>
            )}
          </h3>
          <p className="text-[11px] muted">
            {result.generated_at && formatRelative(result.generated_at)}
            {result.cached && ' · cache 24h'}
          </p>
        </div>
      </header>

      {/* Score + reception */}
      <div className={cn('mt-3 flex items-center justify-between gap-3 rounded-md px-3 py-2', tone.bg)}>
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Recepción esperada
          </div>
          <div className={cn('serif text-[16px] font-semibold leading-tight', tone.color)}>
            {tone.label}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Alineación
          </div>
          <div className="serif tabular text-[20px] font-semibold">{scorePct}%</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-bg-sunken">
        <div
          className={cn(
            'h-full rounded-full',
            result.reception === 'favorable' && 'bg-ok',
            result.reception === 'mixto' && 'bg-accent',
            result.reception === 'desfavorable' && 'bg-danger',
            result.reception === 'incierto' && 'bg-warn',
          )}
          style={{ width: `${scorePct}%` }}
        />
      </div>

      {/* Summary */}
      <p className="mt-3 text-[12.5px] leading-relaxed">{result.summary}</p>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="mt-3">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ok">
            <CheckCircle2 size={11} /> Fortalezas
          </h4>
          <ul className="flex flex-col gap-1">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-ink-2">
                <span className="mt-1 inline-block h-1 w-1 flex-none rounded-full bg-ok" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk factors */}
      {result.risk_factors.length > 0 && (
        <div className="mt-3">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-warn">
            <AlertTriangle size={11} /> Factores de riesgo
          </h4>
          <ul className="flex flex-col gap-1">
            {result.risk_factors.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-ink-2">
                <span className="mt-1 inline-block h-1 w-1 flex-none rounded-full bg-warn" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested revisions */}
      {result.suggested_revisions.length > 0 && (
        <div className="mt-3 rounded-md border-l-2 border-accent bg-accent-soft p-2.5">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent">
            <Lightbulb size={11} /> Sugerencias de revisión
          </h4>
          <ul className="flex flex-col gap-1">
            {result.suggested_revisions.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px]">
                <ArrowRight size={11} className="mt-0.5 flex-none text-accent" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Similar decisions */}
      {result.similar_decisions.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <h4 className="m-0 mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            <FileWarning size={11} /> Decisiones similares del juez
          </h4>
          <ul className="flex flex-col gap-1">
            {result.similar_decisions.map((d, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[11.5px]">
                <span className={cn('chip text-[10px]',
                  d.outcome.toLowerCase().includes('favor') ? 'chip-green' :
                  d.outcome.toLowerCase().includes('desfav') ? 'chip-danger' :
                  'chip-neutral',
                )}>
                  {d.outcome || '?'}
                </span>
                <span className="mono text-[11px] text-accent">{d.numero}</span>
                {d.fecha && <span className="text-[10.5px] muted">{d.fecha}</span>}
                <span className="ml-auto text-[10.5px] muted">
                  rel {Math.round((d.relevance || 0) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] muted">
        Predicción generada con IA basada en el perfil del juez y decisiones recientes. No es asesoría
        legal · revisa siempre el criterio de tu abogado titulado antes de actuar.
      </p>
    </section>
  );
}
