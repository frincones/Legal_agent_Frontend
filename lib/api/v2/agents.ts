/** Frontend SDK · /v2/agents/* (Sprint M21.S4). */

export type AgentCatalogItem = {
  name: string;
  description: string;
  trigger_kind: 'cron' | 'event';
  default_cron?: string | null;
  default_event?: string | null;
  timeout_seconds: number;
  job?: {
    job_id: string;
    enabled: boolean;
    schedule_cron?: string | null;
    config?: Record<string, unknown>;
    last_run_at?: string | null;
    last_run_status?: string | null;
  } | null;
};

export type AgentRun = {
  run_id: string;
  agent_name?: string;
  trigger_kind: 'cron' | 'event' | 'manual';
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  status: 'running' | 'ok' | 'error' | 'timeout' | 'skipped';
  items_processed?: number;
  items_succeeded?: number;
  items_failed?: number;
  output_summary?: string;
  error_message?: string;
};

async function jor<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`agents API ${res.status}: ${t || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listAgents(): Promise<{ items: AgentCatalogItem[]; total: number }> {
  return jor(await fetch('/api/v2/agents', { cache: 'no-store' }));
}

export async function getAgent(name: string): Promise<AgentCatalogItem & { last_runs: AgentRun[] }> {
  return jor(await fetch(`/api/v2/agents/${name}`, { cache: 'no-store' }));
}

export async function runAgentNow(name: string, config: Record<string, unknown> = {}): Promise<AgentRun & { agent_name: string }> {
  return jor(await fetch(`/api/v2/agents/${name}/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ config }),
  }));
}

export async function toggleAgent(name: string, enabled: boolean): Promise<{ agent_name: string; enabled: boolean }> {
  return jor(await fetch(`/api/v2/agents/${name}/toggle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ enabled }),
  }));
}

export async function listAllRuns(limit = 50, agent_name?: string): Promise<{ items: AgentRun[]; total: number }> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (agent_name) qs.set('agent_name', agent_name);
  return jor(await fetch(`/api/v2/agents/runs?${qs}`, { cache: 'no-store' }));
}
