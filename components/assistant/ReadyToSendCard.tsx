'use client';

/**
 * ReadyToSendCard — HITL gate after the multi-agent finishes.
 *
 * Shown in the AssistantSidebar thread when a document_generator run
 * emits `ready_to_send`. Surfaces:
 *  - Composite quality score (from quality_validator)
 *  - Per-dimension scores (judge_quality breakdown)
 *  - Critical issues (must address before approve)
 *  - Warnings (advisory)
 *  - Assumptions (slots the agent inferred without confirmation)
 *
 * User chooses Approve / Edit / Postpone.
 */

import { useState } from 'react';

export interface ReadyToSendData {
  generation_id: string;
  document_md: string;
  judge_score: number | null;
  dimension_scores: Record<string, number> | null;
  issues: string[];
  assumptions: string[];
  errors?: string[];
}

interface ReadyToSendCardProps {
  data: ReadyToSendData;
  onApprove: () => void | Promise<void>;
  onEdit: () => void;
  onPostpone: () => void;
}

const DIMENSION_LABELS: Record<string, string> = {
  completeness: 'Completitud',
  formality: 'Formalidad',
  persuasiveness: 'Persuasión',
  compliance: 'Cumplimiento',
  clarity: 'Claridad',
  faithfulness: 'Fidelidad',
};

function scoreColor(score: number): string {
  if (score >= 0.85) return 'text-ok';
  if (score >= 0.7) return 'text-warn';
  return 'text-danger';
}

function scoreBg(score: number): string {
  if (score >= 0.85) return 'bg-ok-soft';
  if (score >= 0.7) return 'bg-warn-soft';
  return 'bg-danger-soft';
}

export function ReadyToSendCard({ data, onApprove, onEdit, onPostpone }: ReadyToSendCardProps) {
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const score = data.judge_score ?? 0;
  const scorePct = Math.round(score * 100);
  const hasBlockers = data.issues.length > 0;

  const handleApprove = async () => {
    setBusy(true);
    try {
      await onApprove();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="border-accent/40 bg-bg-elev rounded-md border-2 p-3 shadow-2"
      role="region"
      aria-label="Documento listo para revisar"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={[
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              scoreBg(score),
              scoreColor(score),
            ].join(' ')}
            aria-label={`Score ${scorePct}%`}
          >
            ✓
          </span>
          <div>
            <div className="text-ink text-sm font-semibold">
              Documento listo
            </div>
            <div className={`text-xs ${scoreColor(score)}`}>
              Calidad estimada {scorePct}%
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-ink-3 hover:text-ink text-xs"
          aria-expanded={showDetails}
        >
          {showDetails ? 'Ocultar' : 'Ver detalles'}
        </button>
      </div>

      {showDetails && data.dimension_scores && (
        <div className="border-line mt-2 grid grid-cols-2 gap-1 border-t pt-2">
          {Object.entries(data.dimension_scores).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <span className="text-ink-2">{DIMENSION_LABELS[k] ?? k}</span>
              <span className={`font-medium ${scoreColor(v)}`}>
                {Math.round(v * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {data.issues.length > 0 && (
        <div className="mt-3">
          <div className="text-ink-3 mb-1 text-[10px] uppercase tracking-wide">
            Confirma antes de enviar
          </div>
          <ul className="text-ink space-y-1 text-xs">
            {data.issues.slice(0, 5).map((it, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-warn shrink-0">●</span>
                <span>{it}</span>
              </li>
            ))}
            {data.issues.length > 5 && (
              <li className="text-ink-3 italic">
                +{data.issues.length - 5} más
              </li>
            )}
          </ul>
        </div>
      )}

      {data.assumptions.length > 0 && (
        <div className="mt-3">
          <div className="text-ink-3 mb-1 text-[10px] uppercase tracking-wide">
            Asunciones del agente
          </div>
          <ul className="text-ink-2 space-y-1 text-xs">
            {data.assumptions.slice(0, 4).map((a, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-ink-3 shrink-0">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-line mt-3 flex flex-wrap gap-1.5 border-t pt-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy}
          className={[
            'rounded-sm px-3 py-1.5 text-xs font-medium transition-colors',
            hasBlockers
              ? 'bg-warn text-bg hover:opacity-90'
              : 'bg-ok text-bg hover:opacity-90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
        >
          {busy ? 'Aprobando…' : hasBlockers ? '✓ Aprobar con observaciones' : '✓ Aprobar'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={busy}
          className="text-ink hover:bg-bg-sunken border-line rounded-sm border px-3 py-1.5 text-xs font-medium"
        >
          ✎ Editar
        </button>
        <button
          type="button"
          onClick={onPostpone}
          disabled={busy}
          className="text-ink-2 hover:bg-bg-sunken ml-auto rounded-sm px-3 py-1.5 text-xs"
        >
          ⏸ Posponer
        </button>
      </div>
    </div>
  );
}
