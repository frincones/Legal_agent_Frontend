/** Frontend SDK · /v2/cookbooks/* (Sprint M21.S7). */

export type CookbookItem = {
  cookbook_id: string;
  name: string;
  category: 'corporate' | 'litigation' | 'notarial' | 'transactional';
  short_description: string;
  long_description_md?: string | null;
  icon?: string | null;
  inputs_schema: Record<string, unknown>;
  estimated_minutes?: number;
  pricing_tier: 'free' | 'pro' | 'enterprise';
  version: string;
  documentation_url?: string | null;
};

export type CookbookDetail = CookbookItem & { steps: Array<Record<string, unknown>> };

export type CookbookRun = {
  run_id: string;
  cookbook_id: string;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  status: 'running' | 'ok' | 'error' | 'cancelled';
  error_message?: string | null;
};

export type CookbookRunDetail = CookbookRun & {
  matter_id?: string | null;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  steps: Array<{
    step_index: number;
    step_name: string;
    started_at?: string;
    finished_at?: string;
    duration_ms?: number;
    status: string;
    output?: unknown;
    error_message?: string | null;
  }>;
};

async function jor<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`cookbooks API ${res.status}: ${t || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listCookbooks(category?: string): Promise<{ items: CookbookItem[]; total: number }> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return jor(await fetch(`/api/v2/cookbooks${qs}`, { cache: 'no-store' }));
}

export async function getCookbook(id: string): Promise<CookbookDetail> {
  return jor(await fetch(`/api/v2/cookbooks/${id}`, { cache: 'no-store' }));
}

export async function runCookbook(id: string, inputs: Record<string, unknown>, matter_id?: string): Promise<{
  run_id: string;
  cookbook_id: string;
  status: string;
  duration_ms: number;
  steps_executed: number;
  outputs: Record<string, unknown>;
  error_message?: string | null;
}> {
  return jor(await fetch(`/api/v2/cookbooks/${id}/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ inputs, matter_id }),
  }));
}

export async function listCookbookRuns(limit = 50, cookbook_id?: string): Promise<{ items: CookbookRun[]; total: number }> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cookbook_id) qs.set('cookbook_id', cookbook_id);
  return jor(await fetch(`/api/v2/cookbooks/runs/list?${qs}`, { cache: 'no-store' }));
}

export async function getCookbookRun(run_id: string): Promise<CookbookRunDetail> {
  return jor(await fetch(`/api/v2/cookbooks/runs/${run_id}`, { cache: 'no-store' }));
}
