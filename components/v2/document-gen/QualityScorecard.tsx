'use client';

/**
 * components/v2/document-gen/QualityScorecard.tsx
 *
 * Card de calidad final del documento generado.
 * Muestra dimensiones de scoring + warnings + acciones siguientes.
 */

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { QualityScore, CitationStatus } from '@/lib/v2/document-gen/useDocumentGenStream';

export interface QualityScorecardProps {
  qualityScore: QualityScore | null;
  citations: CitationStatus[];
  citationRate: number | null;
  totalSections: number;
  completedSections: number;
  onExport?: () => void;
  onRequestChanges?: () => void;
  onRate?: (rating: number) => void;
}

function ScoreDimension({ label, value, format = 'percent' }: { label: string; value: number; format?: 'percent' | 'count' }) {
  const pct = format === 'percent' ? value * 100 : value;
  const display = format === 'percent' ? `${pct.toFixed(0)}%` : String(value);

  const tone = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red';
  const colors = {
    emerald: { text: 'text-emerald-700', bar: 'bg-emerald-500' },
    amber: { text: 'text-amber-700', bar: 'bg-amber-500' },
    red: { text: 'text-red-700', bar: 'bg-red-500' },
  }[tone];

  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>{label}</span>
        <span className={`font-medium tabular-nums ${colors.text}`}>{display}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--v2-bg-subtle,#F2F1EC)]">
        <div className={`h-full transition-all duration-500 ${colors.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export function QualityScorecard({
  qualityScore,
  citations,
  citationRate,
  totalSections,
  completedSections,
  onExport,
  onRequestChanges,
  onRate,
}: QualityScorecardProps) {
  const verified = citations.filter((c) => c.status === 'verified').length;
  const suspicious = citations.filter((c) => c.status === 'suspicious').length;
  const notFound = citations.filter((c) => c.status === 'not_found').length;
  const totalCitations = citations.length;

  const completeness = totalSections > 0 ? completedSections / totalSections : 0;
  const overall = qualityScore?.judge_score ?? completeness;

  const riskLevel = overall >= 0.85 && notFound === 0 ? 'Bajo' : overall >= 0.7 ? 'Medio' : 'Alto';
  const riskColor = riskLevel === 'Bajo' ? 'text-emerald-700' : riskLevel === 'Medio' ? 'text-amber-700' : 'text-red-700';

  return (
    <aside
      className="rounded-lg border bg-white p-4 shadow-sm"
      style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
      aria-label="Tarjeta de calidad del documento"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-[14px] font-semibold"
          style={{
            fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
            color: 'var(--v2-text-primary, #1A1916)',
          }}
        >
          Calidad del documento
        </h3>
        <span className={`text-[11px] font-medium ${riskColor}`}>
          Riesgo: {riskLevel}
        </span>
      </div>

      {/* Dimensiones */}
      <div className="space-y-3">
        <ScoreDimension label="Completitud" value={completeness} />
        <ScoreDimension label="Citas válidas" value={totalCitations > 0 ? verified / totalCitations : 1} />
        {qualityScore?.dimensions && Object.entries(qualityScore.dimensions).map(([k, v]) => (
          <ScoreDimension key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} value={v} />
        ))}
      </div>

      {/* Citation breakdown */}
      {totalCitations > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
          <div className="rounded-md bg-emerald-50 p-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700">Verificadas</div>
            <div className="mt-0.5 text-[16px] font-semibold tabular-nums text-emerald-700">{verified}</div>
          </div>
          <div className="rounded-md bg-amber-50 p-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-amber-700">Sospechosas</div>
            <div className="mt-0.5 text-[16px] font-semibold tabular-nums text-amber-700">{suspicious}</div>
          </div>
          <div className="rounded-md bg-red-50 p-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-red-700">No encontradas</div>
            <div className="mt-0.5 text-[16px] font-semibold tabular-nums text-red-700">{notFound}</div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {qualityScore?.issues && qualityScore.issues.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-amber-800">
                {qualityScore.issues.length} {qualityScore.issues.length === 1 ? 'observación' : 'observaciones'}
              </div>
              <ul className="mt-1 space-y-0.5 text-[11px] text-amber-700">
                {qualityScore.issues.slice(0, 3).map((issue, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {overall >= 0.9 && notFound === 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <strong>Documento listo</strong>
            <p className="mt-0.5">Calidad excelente, todas las citas verificadas.</p>
          </div>
        </div>
      )}

      {/* Critical */}
      {(overall < 0.6 || notFound > 2) && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-[11px] text-red-800">
          <XCircle size={14} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
          <div>
            <strong>Requiere revisión</strong>
            <p className="mt-0.5">Revise las citas marcadas en rojo y considere regenerar secciones críticas.</p>
          </div>
        </div>
      )}

      {/* Rating */}
      {onRate && (overall >= 0.7 || citationRate != null) && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
          <div className="text-[11px] font-medium" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
            ¿Qué tan útil fue este documento?
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onRate(rating)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
                style={{
                  border: '1px solid var(--v2-border-default, #D4D2CA)',
                  color: 'var(--v2-text-secondary, #4A4944)',
                }}
                aria-label={`Calificar ${rating} de 5`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {(onExport || onRequestChanges) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
          {onRequestChanges && (
            <button
              type="button"
              onClick={onRequestChanges}
              className="flex-1 rounded-md border bg-white px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
              style={{
                borderColor: 'var(--v2-border-default, #D4D2CA)',
                color: 'var(--v2-text-secondary, #4A4944)',
              }}
            >
              Solicitar cambios
            </button>
          )}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
            >
              Exportar documento
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
