/** Frontend SDK · /v2/plugins/* (Sprint M21.S6 Marketplace). */

export type PluginItem = {
  plugin_id: string;
  name: string;
  category: 'intake' | 'productivity' | 'billing' | 'analytics' | 'compliance' | 'integration' | 'ai';
  short_description: string;
  long_description_md?: string | null;
  icon?: string | null;
  route_path?: string | null;
  api_namespaces: string[];
  requires_modules: string[];
  pricing_tier: 'free' | 'pro' | 'enterprise';
  version: string;
  documentation_url?: string | null;
  screenshots: string[];
  installation?: {
    enabled: boolean;
    installed_at?: string | null;
    config: Record<string, unknown>;
  } | null;
};

async function jor<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`plugins API ${res.status}: ${t || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listPlugins(opts: { category?: string; installed_only?: boolean } = {}): Promise<{ items: PluginItem[]; total: number }> {
  const qs = new URLSearchParams();
  if (opts.category) qs.set('category', opts.category);
  if (opts.installed_only) qs.set('installed_only', 'true');
  const s = qs.toString();
  return jor(await fetch(`/api/v2/plugins${s ? `?${s}` : ''}`, { cache: 'no-store' }));
}

export async function getPlugin(id: string): Promise<PluginItem> {
  return jor(await fetch(`/api/v2/plugins/${id}`, { cache: 'no-store' }));
}

export async function installPlugin(id: string, config: Record<string, unknown> = {}): Promise<{ plugin_id: string; installed: true }> {
  return jor(await fetch(`/api/v2/plugins/${id}/install`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ config }),
  }));
}

export async function uninstallPlugin(id: string): Promise<{ plugin_id: string; installed: false }> {
  return jor(await fetch(`/api/v2/plugins/${id}/uninstall`, { method: 'POST' }));
}
