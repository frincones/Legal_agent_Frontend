'use client';

/**
 * components/admin/pipeline/GlobalMetricsCards.tsx
 *
 * Grid de cards con metricas globales del pipeline:
 * workers, jobs, docs ingestados, storage, costos.
 */

import type { PipelineStatusGlobal } from '@/lib/admin/pipeline/types';

interface GlobalMetricsCardsProps {
  status: PipelineStatusGlobal;
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'ok' | 'warn' | 'critical' | 'neutral';
}

function Card({ label, value, sub, tone = 'neutral' }: CardProps) {
  const toneStyles = {
    ok: 'border-emerald-200',
    warn: 'border-amber-200',
    critical: 'border-red-200',
    neutral: 'border-[var(--v2-border-default,#D4D2CA)]',
  }[tone];

  return (
    <div className={`rounded-lg border bg-white p-4 ${toneStyles}`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
        {label}
      </div>
      <div
        className="mt-2 text-[24px] font-medium leading-none"
        style={{
          fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
          color: 'var(--v2-text-primary, #1A1916)',
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 text-[11px] text-[var(--v2-text-tertiary,#807E76)]">{sub}</div>
      )}
    </div>
  );
}

export function GlobalMetricsCards({ status }: GlobalMetricsCardsProps) {
  const postgresTone: CardProps['tone'] =
    status.storage.postgres_pct >= 90 ? 'critical' : status.storage.postgres_pct >= 80 ? 'warn' : 'ok';
  const r2Tone: CardProps['tone'] =
    status.storage.r2_pct >= 90 ? 'critical' : status.storage.r2_pct >= 80 ? 'warn' : 'ok';

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card
        label="Workers activos"
        value={`${status.active_workers} / ${status.total_workers}`}
        sub={status.active_workers > 0 ? 'Procesando' : 'Idle'}
        tone={status.active_workers > 0 ? 'ok' : 'neutral'}
      />
      <Card
        label="Jobs en cola"
        value={status.jobs_queued.toLocaleString('es-CO')}
        sub={`${status.jobs_running} ejecutando`}
      />
      <Card
        label="Docs hoy"
        value={status.docs_ingested_today.toLocaleString('es-CO')}
        sub={`${status.docs_ingested_last_24h.toLocaleString('es-CO')} últ. 24h`}
        tone="ok"
      />
      <Card
        label="Fallos últ. 24h"
        value={status.jobs_failed_last_24h.toString()}
        sub={status.jobs_failed_last_24h > 100 ? 'Investigar' : 'Bajo control'}
        tone={status.jobs_failed_last_24h > 100 ? 'warn' : 'ok'}
      />
      <Card
        label="Postgres"
        value={`${status.storage.postgres_pct.toFixed(1)}%`}
        sub={`${(status.storage.postgres_pct * 5).toFixed(0)} MB / 500 MB`}
        tone={postgresTone}
      />
      <Card
        label="R2 storage"
        value={`${status.storage.r2_pct.toFixed(1)}%`}
        sub={`${(status.storage.r2_pct * 0.1).toFixed(2)} GB / 10 GB`}
        tone={r2Tone}
      />
      <Card
        label="Costo hoy"
        value={`$${status.cost_today_usd.toFixed(2)}`}
        sub="Embeddings + LLM"
      />
      <Card
        label="Costo mes"
        value={`$${status.cost_month_usd.toFixed(2)}`}
        sub="Acumulado"
        tone={status.cost_month_usd > 200 ? 'warn' : 'ok'}
      />
    </div>
  );
}
