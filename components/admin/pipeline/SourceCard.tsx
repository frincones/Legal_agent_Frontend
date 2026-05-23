'use client';

/**
 * components/admin/pipeline/SourceCard.tsx
 *
 * Card individual por fuente con progress bar + stats + ETA.
 */

import type { SourceStats } from '@/lib/admin/pipeline/types';

interface SourceCardProps {
  source: SourceStats;
}

function formatEta(eta: string | null): string {
  if (!eta) return '—';
  try {
    const target = new Date(eta).getTime();
    const diffMs = target - Date.now();
    if (diffMs <= 0) return 'inminente';
    const hours = Math.floor(diffMs / 3600_000);
    const mins = Math.floor((diffMs % 3600_000) / 60_000);
    if (hours > 24) return `~${Math.round(hours / 24)} días`;
    if (hours > 0) return `~${hours}h ${mins}min`;
    return `~${mins}min`;
  } catch {
    return '—';
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Nunca';
  try {
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return `hace ${diffSec}s`;
    if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)}min`;
    if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)}h`;
    return `hace ${Math.floor(diffSec / 86400)}d`;
  } catch {
    return '—';
  }
}

export function SourceCard({ source }: SourceCardProps) {
  const isComplete = source.pct_done >= 100;
  const isActive = source.processing > 0;
  const isPending = source.pct_done === 0;
  const hasErrors = source.failed > 0;

  const statusColor = isComplete
    ? 'border-emerald-300 bg-emerald-50'
    : isActive
      ? 'border-blue-300 bg-blue-50'
      : isPending
        ? 'border-[var(--v2-border-subtle,#E8E7E1)] bg-white'
        : 'border-amber-300 bg-amber-50';

  const progressColor = isComplete
    ? 'bg-emerald-500'
    : isActive
      ? 'bg-blue-500'
      : 'bg-[var(--v2-brand-navy,#0E2A5E)]';

  return (
    <div className={`rounded-lg border p-4 transition-colors ${statusColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[14px] font-medium"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            {source.display_name}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase text-[var(--v2-text-tertiary,#807E76)]">
            {source.source}
          </div>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden />
            ACTIVO
          </span>
        )}
        {isComplete && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            COMPLETADO
          </span>
        )}
        {isPending && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            PENDIENTE
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="font-medium tabular-nums" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
            {source.completed.toLocaleString('es-CO')} / {source.total.toLocaleString('es-CO')}
          </span>
          <span className="tabular-nums text-[var(--v2-text-tertiary,#807E76)]">
            {source.pct_done.toFixed(1)}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--v2-bg-subtle,#F2F1EC)]">
          <div
            className={`h-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(source.pct_done, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        {source.processing > 0 && (
          <div>
            <span className="text-[var(--v2-text-tertiary,#807E76)]">Procesando:</span>{' '}
            <span className="font-medium tabular-nums text-blue-700">{source.processing}</span>
          </div>
        )}
        {hasErrors && (
          <div>
            <span className="text-[var(--v2-text-tertiary,#807E76)]">Fallos:</span>{' '}
            <span className="font-medium tabular-nums text-red-700">{source.failed}</span>
          </div>
        )}
        {source.eta && (
          <div className="col-span-2">
            <span className="text-[var(--v2-text-tertiary,#807E76)]">ETA:</span>{' '}
            <span className="font-medium">{formatEta(source.eta)}</span>
          </div>
        )}
        <div className="col-span-2">
          <span className="text-[var(--v2-text-tertiary,#807E76)]">Último:</span>{' '}
          <span className="font-medium">{formatRelative(source.last_completed_at)}</span>
        </div>
      </div>

      {/* Last error */}
      {source.last_error && (
        <div className="mt-2 truncate rounded bg-red-50 px-2 py-1 text-[10px] text-red-700" title={source.last_error}>
          {source.last_error}
        </div>
      )}
    </div>
  );
}
