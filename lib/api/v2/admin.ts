/** Frontend SDK · /v2/admin/* (Sprint M21.S8 hardening). */

export type UsageItem = {
  resource_type: string;
  count: number;
  cost_usd: number;
  last_updated?: string;
};

export type UsageSummary = {
  firm_id: string;
  period_month: string;
  items: UsageItem[];
  total_cost_usd: number;
};

export type AuditEvent = {
  event_id: number;
  event_kind: string;
  actor_user_id?: string | null;
  actor_role?: string | null;
  ip_address?: string | null;
  target_resource?: string | null;
  summary?: string | null;
  details: Record<string, unknown>;
  created_at?: string;
};

export type RateLimit = {
  resource_type: string;
  count_minute: number;
  count_hour: number;
  limit_minute: number;
  limit_hour: number;
  last_at?: string;
};

export type HabeasExport = {
  export_id: string;
  subject_kind: 'cedula' | 'email' | 'client_id';
  subject_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'expired';
  requested_at?: string;
  completed_at?: string;
  file_size_bytes?: number;
  expires_at?: string;
  tables_included: Array<{ table: string; rows: number }>;
  error_message?: string | null;
};

async function jor<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`admin API ${res.status}: ${t || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function getUsage(month?: string): Promise<UsageSummary> {
  return jor(await fetch(month ? `/api/v2/admin/usage/${month}` : '/api/v2/admin/usage', { cache: 'no-store' }));
}
export async function listAudit(limit = 100, event_kind?: string): Promise<{ items: AuditEvent[]; total: number }> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (event_kind) qs.set('event_kind', event_kind);
  return jor(await fetch(`/api/v2/admin/audit?${qs}`, { cache: 'no-store' }));
}
export async function getRateLimits(): Promise<{ items: RateLimit[] }> {
  return jor(await fetch('/api/v2/admin/rate-limits', { cache: 'no-store' }));
}
export async function listHabeasExports(limit = 50): Promise<{ items: HabeasExport[]; total: number }> {
  return jor(await fetch(`/api/v2/admin/habeas-data?limit=${limit}`, { cache: 'no-store' }));
}
export async function requestHabeasExport(subject_kind: 'cedula' | 'email' | 'client_id', subject_id: string): Promise<HabeasExport> {
  return jor(await fetch('/api/v2/admin/habeas-data/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ subject_kind, subject_id }),
  }));
}
export function downloadHabeasUrl(export_id: string): string {
  return `/api/v2/admin/habeas-data/${export_id}`;
}
