'use client';

/**
 * components/admin/pipeline/SourcesGrid.tsx
 *
 * Grid de SourceCards para todas las fuentes del corpus.
 * Permite filtrado por estado (todas | activas | completadas | pendientes).
 */

import { useMemo, useState } from 'react';
import { SourceCard } from './SourceCard';
import type { SourceStats } from '@/lib/admin/pipeline/types';

type Filter = 'all' | 'active' | 'completed' | 'pending' | 'failed';

interface SourcesGridProps {
  sources: SourceStats[];
}

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'failed', label: 'Con fallos' },
];

export function SourcesGrid({ sources }: SourcesGridProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => ({
    all: sources.length,
    active: sources.filter((s) => s.processing > 0).length,
    completed: sources.filter((s) => s.pct_done >= 100).length,
    pending: sources.filter((s) => s.pct_done === 0).length,
    failed: sources.filter((s) => s.failed > 0).length,
  }), [sources]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':
        return sources.filter((s) => s.processing > 0);
      case 'completed':
        return sources.filter((s) => s.pct_done >= 100);
      case 'pending':
        return sources.filter((s) => s.pct_done === 0);
      case 'failed':
        return sources.filter((s) => s.failed > 0);
      default:
        return sources;
    }
  }, [sources, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                isActive
                  ? 'border-[var(--v2-brand-navy,#0E2A5E)] bg-[var(--v2-brand-navy,#0E2A5E)] text-white'
                  : 'border-[var(--v2-border-default,#D4D2CA)] bg-white text-[var(--v2-text-secondary,#4A4944)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)]'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  isActive ? 'bg-white/20' : 'bg-[var(--v2-bg-subtle,#F2F1EC)]'
                }`}
              >
                {counts[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)] p-8 text-center text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
          Sin fuentes en este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((source) => (
            <SourceCard key={source.source} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
