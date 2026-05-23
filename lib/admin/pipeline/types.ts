/**
 * lib/admin/pipeline/types.ts
 *
 * Tipos compartidos para el modulo admin Pipeline.
 * Refleja el contrato que el backend Python expondra en
 * /admin/pipeline/* (endpoints documentados en docs/sprint_l_doc/).
 *
 * Mientras el backend no este listo, los endpoints Next.js devuelven
 * mocked data con la misma forma (ver app/api/admin/pipeline/*).
 */

export type IngestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export type SourceId =
  | 'corte_cc'
  | 'corte_suprema'
  | 'consejo_estado'
  | 'suin_juriscol'
  | 'senado'
  | 'colombia_compra'
  | 'defensoria'
  | 'icbf'
  | 'minjusticia'
  | 'mintrabajo'
  | 'ccb'
  | 'dian'
  | 'jep'
  | 'datos_gov_co'
  | 'hf_datasets'
  | 'repos_universitarios'
  | 'diario_oficial';

export interface SourceStats {
  source: SourceId;
  display_name: string;
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  skipped: number;
  pct_done: number;
  avg_seconds_per_doc: number | null;
  total_minutes_spent: number;
  last_completed_at: string | null;
  eta: string | null;
  last_error: string | null;
}

export interface InventoryItem {
  doc_type: string;
  source: SourceId | string;
  materia: string | null;
  count: number;
  last_ingested_at: string | null;
}

export interface InventorySummary {
  total_documents: number;
  total_chunks: number;
  total_templates: number;
  total_sentencias: number;
  total_normas: number;
  postgres_size_mb: number;
  postgres_limit_mb: number;
  r2_size_gb: number;
  r2_limit_gb: number;
  embeddings_cost_usd: number;
  last_updated_at: string;
  by_source: InventoryItem[];
}

export interface RunningJob {
  job_id: string;
  source: SourceId;
  scheduled_at: string;
  started_at: string | null;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  worker_id: string | null;
  current_url: string | null;
  progress_pct: number;
  docs_processed: number;
  docs_total: number;
  errors_count: number;
  next_retry_at: string | null;
}

export interface CronJob {
  job_id: string;
  name: string;
  source: SourceId | 'system';
  cron_expression: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string;
  last_status: 'success' | 'failed' | 'skipped' | null;
  last_duration_seconds: number | null;
  description: string;
}

export interface PipelineLogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  source: SourceId | 'system';
  job_id: string | null;
  message: string;
  context: Record<string, unknown> | null;
}

export interface PipelineStatusGlobal {
  health: 'healthy' | 'degraded' | 'critical';
  active_workers: number;
  total_workers: number;
  jobs_queued: number;
  jobs_running: number;
  jobs_failed_last_24h: number;
  docs_ingested_today: number;
  docs_ingested_last_24h: number;
  storage: {
    postgres_pct: number;
    r2_pct: number;
  };
  cost_today_usd: number;
  cost_month_usd: number;
}
