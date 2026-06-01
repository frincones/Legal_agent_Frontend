/** Frontend SDK · /v2/connectors/* (Sprint M21.S5 MCP Registry). */

export type ConnectorItem = {
  connector_id: string;
  name: string;
  category: 'judicial' | 'normativo' | 'fiscal' | 'propiedad' | 'registro' | 'administrativo';
  description: string;
  jurisdiction: string;
  base_url?: string | null;
  api_kind: 'http' | 'scrape' | 'graphql' | 'mcp';
  auth_required: boolean;
  rate_limit_rps?: number | null;
  tags: string[];
  documentation_url?: string | null;
  subscription?: {
    enabled: boolean;
    last_used_at?: string | null;
    use_count: number;
    config: Record<string, unknown>;
  } | null;
};

export type ConnectorHealth = {
  checked_at?: string;
  status: 'up' | 'down' | 'degraded';
  latency_ms?: number | null;
  error_message?: string | null;
};

async function jor<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`connectors API ${res.status}: ${t || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listConnectors(category?: string): Promise<{ items: ConnectorItem[]; total: number }> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return jor(await fetch(`/api/v2/connectors${qs}`, { cache: 'no-store' }));
}

export async function listCategories(): Promise<{ items: { category: string; count: number }[] }> {
  return jor(await fetch('/api/v2/connectors/categories', { cache: 'no-store' }));
}

export async function getConnector(id: string): Promise<ConnectorItem & { recent_health: ConnectorHealth[] }> {
  return jor(await fetch(`/api/v2/connectors/${id}`, { cache: 'no-store' }));
}

export async function subscribeConnector(id: string, config: Record<string, unknown> = {}): Promise<{ connector_id: string; subscribed: true }> {
  return jor(await fetch(`/api/v2/connectors/${id}/subscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ config }),
  }));
}

export async function unsubscribeConnector(id: string): Promise<{ connector_id: string; subscribed: false }> {
  return jor(await fetch(`/api/v2/connectors/${id}/unsubscribe`, { method: 'POST' }));
}

export async function probeConnector(id: string): Promise<{ connector_id: string; status: string; latency_ms?: number; error?: string }> {
  return jor(await fetch(`/api/v2/connectors/${id}/probe`, { method: 'POST' }));
}
