'use client';

/**
 * components/admin/pipeline/CronJobsTable.tsx
 *
 * Tabla de cronjobs programados con APScheduler:
 *  - cron_expression, enabled, last_run, next_run, last_status
 */

import type { CronJob } from '@/lib/admin/pipeline/types';

interface CronJobsTableProps {
  jobs: CronJob[];
}

const STATUS_STYLES: Record<NonNullable<CronJob['last_status']>, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-700',
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Nunca';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function CronJobsTable({ jobs }: CronJobsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white">
      <table className="w-full text-[12px]">
        <thead className="bg-[var(--v2-bg-subtle,#F2F1EC)]">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Job</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Cron</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Estado</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Último</th>
            <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Próximo</th>
            <th className="px-3 py-2 text-right font-medium text-[var(--v2-text-secondary,#4A4944)]">Duración</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.job_id} className="border-t border-[var(--v2-border-subtle,#E8E7E1)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)]/50">
              <td className="px-3 py-2">
                <div className="font-medium" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                  {job.name}
                </div>
                <div className="text-[10px] text-[var(--v2-text-tertiary,#807E76)]">{job.description}</div>
              </td>
              <td className="px-3 py-2 font-mono text-[11px]">{job.cron_expression}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      job.enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {job.enabled ? 'ACTIVO' : 'PAUSADO'}
                  </span>
                  {job.last_status && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[job.last_status]}`}>
                      {job.last_status.toUpperCase()}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-[var(--v2-text-secondary,#4A4944)]">{formatDateTime(job.last_run_at)}</td>
              <td className="px-3 py-2 text-[var(--v2-text-secondary,#4A4944)]">{formatDateTime(job.next_run_at)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatDuration(job.last_duration_seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
