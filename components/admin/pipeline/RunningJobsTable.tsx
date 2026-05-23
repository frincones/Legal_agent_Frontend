'use client';

/**
 * components/admin/pipeline/RunningJobsTable.tsx
 *
 * Tabla de workers ejecutando jobs en tiempo real.
 * Muestra current_url, progress, errors, ETA.
 */

import type { RunningJob } from '@/lib/admin/pipeline/types';

interface RunningJobsTableProps {
  jobs: RunningJob[];
}

const STATUS_STYLES: Record<RunningJob['status'], string> = {
  queued: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export function RunningJobsTable({ jobs }: RunningJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--v2-border-default,#D4D2CA)] bg-white p-6 text-center text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
        Sin jobs corriendo actualmente.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white">
      <table className="w-full text-[12px]">
        <thead className="bg-[var(--v2-bg-subtle,#F2F1EC)]">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Worker</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Fuente</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Estado</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">URL actual</th>
            <th className="px-3 py-2 text-right font-medium text-[var(--v2-text-secondary,#4A4944)]">Progreso</th>
            <th className="px-3 py-2 text-right font-medium text-[var(--v2-text-secondary,#4A4944)]">Errores</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.job_id} className="border-t border-[var(--v2-border-subtle,#E8E7E1)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)]/50">
              <td className="px-3 py-2 font-mono text-[11px]">{job.worker_id ?? '—'}</td>
              <td className="px-3 py-2 font-medium">{job.source}</td>
              <td className="px-3 py-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[job.status]}`}>
                  {job.status === 'running' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden />
                  )}
                  {job.status.toUpperCase()}
                </span>
              </td>
              <td className="max-w-[280px] truncate px-3 py-2 font-mono text-[10px] text-[var(--v2-text-tertiary,#807E76)]" title={job.current_url ?? ''}>
                {job.current_url ?? '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-medium">{job.progress_pct.toFixed(1)}%</span>
                  <span className="text-[10px] text-[var(--v2-text-tertiary,#807E76)]">
                    {job.docs_processed.toLocaleString('es-CO')} / {job.docs_total.toLocaleString('es-CO')}
                  </span>
                </div>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                <span className={job.errors_count > 0 ? 'font-medium text-red-700' : 'text-[var(--v2-text-tertiary,#807E76)]'}>
                  {job.errors_count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
