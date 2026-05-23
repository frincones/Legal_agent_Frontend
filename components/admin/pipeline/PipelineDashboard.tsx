'use client';

/**
 * components/admin/pipeline/PipelineDashboard.tsx
 *
 * Dashboard principal del modulo admin Pipeline.
 * Muestra estado global del pipeline de ingesta + tabs para navegar:
 *  - Fuentes (progress por fuente)
 *  - Workers (jobs corriendo + cronjobs)
 *  - Inventario (totales + storage + desglose)
 *  - Logs (stream tiempo real)
 *
 * Auto-refresh cada 10 segundos del estado global.
 * Pausa polling si la pestaña no esta visible.
 */

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { RealtimeStatusBadge } from './RealtimeStatusBadge';
import { GlobalMetricsCards } from './GlobalMetricsCards';
import { SourcesGrid } from './SourcesGrid';
import { InventoryStats } from './InventoryStats';
import { RunningJobsTable } from './RunningJobsTable';
import { CronJobsTable } from './CronJobsTable';
import { LogsViewer } from './LogsViewer';
import { useAutoRefresh } from '@/lib/admin/pipeline/useAutoRefresh';
import type {
  PipelineStatusGlobal,
  SourceStats,
  InventorySummary,
  RunningJob,
  CronJob,
  PipelineLogEntry,
} from '@/lib/admin/pipeline/types';

type Tab = 'sources' | 'workers' | 'inventory' | 'logs';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sources', label: 'Fuentes' },
  { id: 'workers', label: 'Workers y Cronjobs' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'logs', label: 'Logs' },
];

export function PipelineDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('sources');

  const statusQ = useAutoRefresh<PipelineStatusGlobal>('/api/admin/pipeline/status', { intervalMs: 10000 });
  const sourcesQ = useAutoRefresh<SourceStats[]>('/api/admin/pipeline/sources', { intervalMs: 15000 });
  const inventoryQ = useAutoRefresh<InventorySummary>('/api/admin/pipeline/inventory', { intervalMs: 30000 });
  const jobsQ = useAutoRefresh<{ running: RunningJob[]; cron: CronJob[] }>('/api/admin/pipeline/jobs', { intervalMs: 5000 });
  const logsQ = useAutoRefresh<PipelineLogEntry[]>('/api/admin/pipeline/logs?limit=100', { intervalMs: 5000 });

  const refreshAll = async () => {
    await Promise.all([
      statusQ.refresh(),
      sourcesQ.refresh(),
      inventoryQ.refresh(),
      jobsQ.refresh(),
      logsQ.refresh(),
    ]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header: status + manual refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {statusQ.data && statusQ.lastFetched ? (
          <RealtimeStatusBadge
            health={statusQ.data.health}
            source={(statusQ.source ?? 'mock') as 'backend' | 'mock' | 'mock_fallback'}
            lastUpdated={statusQ.lastFetched}
          />
        ) : (
          <div className="text-[12px] text-[var(--v2-text-tertiary,#807E76)]">Cargando estado...</div>
        )}

        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--v2-text-secondary,#4A4944)] transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
        >
          <RefreshCw size={13} aria-hidden />
          Actualizar ahora
        </button>
      </div>

      {/* Global metrics cards */}
      {statusQ.data ? (
        <GlobalMetricsCards status={statusQ.data} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)]" />
          ))}
        </div>
      )}

      {/* Tabs nav */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--v2-border-default,#D4D2CA)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 py-2 text-[13px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--v2-brand-navy,#0E2A5E)]'
                : 'text-[var(--v2-text-tertiary,#807E76)] hover:text-[var(--v2-text-primary,#1A1916)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--v2-brand-navy,#0E2A5E)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'sources' && (
          sourcesQ.data ? (
            <SourcesGrid sources={sourcesQ.data} />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[180px] animate-pulse rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)]" />
              ))}
            </div>
          )
        )}

        {activeTab === 'workers' && (
          <div className="flex flex-col gap-5">
            <section>
              <h3 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                Workers ejecutando ahora
              </h3>
              {jobsQ.data ? (
                <RunningJobsTable jobs={jobsQ.data.running} />
              ) : (
                <div className="h-[160px] animate-pulse rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)]" />
              )}
            </section>

            <section>
              <h3 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                Cronjobs programados
              </h3>
              {jobsQ.data ? (
                <CronJobsTable jobs={jobsQ.data.cron} />
              ) : (
                <div className="h-[200px] animate-pulse rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)]" />
              )}
            </section>
          </div>
        )}

        {activeTab === 'inventory' && (
          inventoryQ.data ? (
            <InventoryStats inventory={inventoryQ.data} />
          ) : (
            <div className="h-[400px] animate-pulse rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)]" />
          )
        )}

        {activeTab === 'logs' && (
          logsQ.data ? (
            <LogsViewer logs={logsQ.data} />
          ) : (
            <div className="h-[400px] animate-pulse rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)]" />
          )
        )}
      </div>
    </div>
  );
}
