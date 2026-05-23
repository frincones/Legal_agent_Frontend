'use client';

/**
 * components/v2/document-gen/StreamingProgressBar.tsx
 *
 * Barra de progreso para el thread mientras el agente genera secciones.
 * Muestra:
 *   - "Generando documento..."
 *   - barra con N/total secciones
 *   - nombre de la seccion actual
 *   - boton cancelar (opcional)
 */

import { Loader2, X } from 'lucide-react';

export interface StreamingProgressBarProps {
  currentSection: number;
  totalSections: number;
  currentSectionTitle: string | null;
  status: 'planning' | 'streaming' | 'verifying' | 'scoring' | 'done' | 'error' | 'aborted';
  onAbort?: () => void;
}

const STATUS_LABELS: Record<StreamingProgressBarProps['status'], string> = {
  planning: 'Planeando documento...',
  streaming: 'Generando',
  verifying: 'Verificando citas...',
  scoring: 'Evaluando calidad...',
  done: 'Documento completo',
  error: 'Error en generación',
  aborted: 'Generación cancelada',
};

export function StreamingProgressBar({
  currentSection,
  totalSections,
  currentSectionTitle,
  status,
  onAbort,
}: StreamingProgressBarProps) {
  const pct = totalSections > 0 ? (currentSection / totalSections) * 100 : 0;
  const isActive = status === 'streaming' || status === 'verifying' || status === 'scoring' || status === 'planning';
  const isError = status === 'error' || status === 'aborted';

  const barColor = isError
    ? 'bg-red-500'
    : status === 'done'
      ? 'bg-emerald-500'
      : 'bg-[var(--v2-brand-navy,#0E2A5E)]';

  return (
    <div
      className="rounded-lg border p-3"
      style={{
        backgroundColor: isError
          ? 'rgba(239,68,68,0.05)'
          : 'var(--v2-bg-subtle, #F2F1EC)',
        borderColor: isError
          ? 'rgb(254, 202, 202)'
          : 'var(--v2-border-default, #D4D2CA)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isActive && (
            <Loader2
              size={14}
              className="shrink-0 animate-spin"
              style={{ color: 'var(--v2-accent-copper, #B8763C)' }}
              aria-hidden
            />
          )}
          <span
            className="text-[13px] font-medium"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            {STATUS_LABELS[status]}
            {status === 'streaming' && totalSections > 0 && (
              <span className="ml-1.5 tabular-nums text-[var(--v2-text-tertiary,#807E76)]">
                {currentSection} / {totalSections}
              </span>
            )}
          </span>
        </div>
        {onAbort && isActive && (
          <button
            type="button"
            onClick={onAbort}
            className="rounded-md p-1 transition-colors hover:bg-[var(--v2-bg-muted,#E8E7E1)]"
            aria-label="Cancelar generación"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--v2-bg-muted,#E8E7E1)]">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(pct, isActive ? 4 : 0)}%` }}
        />
      </div>

      {/* Seccion actual */}
      {currentSectionTitle && status === 'streaming' && (
        <div className="mt-2 text-[11px] text-[var(--v2-text-tertiary,#807E76)]">
          Sección actual: <span className="font-medium text-[var(--v2-text-secondary,#4A4944)]">{currentSectionTitle}</span>
        </div>
      )}
    </div>
  );
}
