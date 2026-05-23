'use client';

/**
 * components/admin/pipeline/LogsViewer.tsx
 *
 * Stream de logs recientes del pipeline con filtros por nivel.
 * Auto-refresh cada 5 segundos.
 */

import { useMemo, useState } from 'react';
import type { PipelineLogEntry } from '@/lib/admin/pipeline/types';

type LevelFilter = 'all' | 'info' | 'warn' | 'error';

interface LogsViewerProps {
  logs: PipelineLogEntry[];
}

const LEVEL_STYLES: Record<PipelineLogEntry['level'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warn: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-red-50 border-red-200 text-red-900',
};

const LEVEL_BADGE: Record<PipelineLogEntry['level'], string> = {
  info: 'bg-blue-500 text-white',
  warn: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function LogsViewer({ logs }: LogsViewerProps) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  const filtered = useMemo(() => {
    if (levelFilter === 'all') return logs;
    return logs.filter((l) => l.level === levelFilter);
  }, [logs, levelFilter]);

  const counts = useMemo(() => ({
    all: logs.length,
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
  }), [logs]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['all', 'info', 'warn', 'error'] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setLevelFilter(level)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              levelFilter === level
                ? 'border-[var(--v2-brand-navy,#0E2A5E)] bg-[var(--v2-brand-navy,#0E2A5E)] text-white'
                : 'border-[var(--v2-border-default,#D4D2CA)] bg-white text-[var(--v2-text-secondary,#4A4944)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)]'
            }`}
          >
            {level === 'all' ? 'Todos' : level.toUpperCase()}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                levelFilter === level ? 'bg-white/20' : 'bg-[var(--v2-bg-subtle,#F2F1EC)]'
              }`}
            >
              {counts[level]}
            </span>
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
            Sin logs en este nivel.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--v2-border-subtle,#E8E7E1)]">
            {filtered.map((log, i) => (
              <li key={`${log.ts}-${i}`} className={`border-l-2 px-3 py-2 text-[12px] ${LEVEL_STYLES[log.level]}`}>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 font-mono text-[10px] text-[var(--v2-text-tertiary,#807E76)]">
                    {formatTime(log.ts)}
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${LEVEL_BADGE[log.level]}`}>
                    {log.level}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--v2-text-tertiary,#807E76)]">
                    [{log.source}]
                  </span>
                  <span className="min-w-0 flex-1 break-words">{log.message}</span>
                </div>
                {log.context && (
                  <pre className="ml-[156px] mt-1 overflow-x-auto rounded bg-black/5 px-2 py-1 font-mono text-[10px]">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
