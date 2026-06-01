/**
 * Frontend SDK · /v2/matters/* (LexAI Claude-for-Legal parity, Sprint M21.S2).
 *
 * Hits Next.js API routes (under /api/v2/matters/*) that proxy a Railway.
 * Tipos alineados con AgentRAGFullApp/backend/api/matters_workspace.py.
 *
 * NOTA: NO sustituye al SDK legacy de /v1/matters (api/matters.py).
 * Es el nuevo namespace /v2/matters basado en tabla matters_workspace.
 */

export type MatterV2 = {
  matter_id: string;
  slug: string;
  title: string;
  area: string;
  side?: string | null;
  jurisdiction: string;
  phase?: string | null;
  opposing_party?: string | null;
  client_name?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MatterV2Detail = MatterV2 & {
  theory_md?: string | null;
  created_by_user_id?: string | null;
};

export type MatterHistoryEvent = {
  event_id: string;
  event_type: string;
  actor_user_id?: string | null;
  actor_agent?: string | null;
  summary?: string | null;
  details?: Record<string, unknown>;
  created_at?: string;
};

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`matters API ${res.status}: ${detail || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listMattersV2(opts: {
  area?: string;
  active_only?: boolean;
  limit?: number;
} = {}): Promise<{ items: MatterV2[]; total: number }> {
  const params = new URLSearchParams();
  if (opts.area) params.set('area', opts.area);
  if (opts.active_only !== undefined) params.set('active_only', String(opts.active_only));
  if (opts.limit) params.set('limit', String(opts.limit));
  const q = params.toString();
  const res = await fetch(`/api/v2/matters${q ? `?${q}` : ''}`, { cache: 'no-store' });
  return jsonOrThrow(res);
}

export async function createMatterV2(input: {
  title: string;
  area: string;
  side?: string;
  slug?: string;
  jurisdiction?: string;
  phase?: string;
  theory_md?: string;
  opposing_party?: string;
  client_name?: string;
  switch_if_exists?: boolean;
}): Promise<{
  matter_id: string;
  slug: string;
  title: string;
  area: string;
  side?: string | null;
  jurisdiction: string;
  phase?: string | null;
  switched: boolean;
  created: boolean;
}> {
  const res = await fetch('/api/v2/matters', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow(res);
}

export async function getMatterV2(matter_id: string): Promise<MatterV2Detail> {
  const res = await fetch(`/api/v2/matters/${matter_id}`, { cache: 'no-store' });
  return jsonOrThrow(res);
}

export async function updateMatterV2(
  matter_id: string,
  patch: {
    title?: string;
    phase?: string;
    theory_md?: string;
    opposing_party?: string;
    client_name?: string;
  },
): Promise<{ matter_id: string; updated_fields: string[] }> {
  const res = await fetch(`/api/v2/matters/${matter_id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return jsonOrThrow(res);
}

export async function archiveMatterV2(matter_id: string): Promise<{ matter_id: string; active: false }> {
  const res = await fetch(`/api/v2/matters/${matter_id}/archive`, { method: 'POST' });
  return jsonOrThrow(res);
}

export async function getMatterV2History(
  matter_id: string,
  limit = 100,
): Promise<{ matter_id: string; events: MatterHistoryEvent[]; total: number }> {
  const res = await fetch(`/api/v2/matters/${matter_id}/history?limit=${limit}`, { cache: 'no-store' });
  return jsonOrThrow(res);
}
