'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listPlugins, installPlugin, uninstallPlugin,
  type PluginItem,
} from '@/lib/api/v2/plugins';

const CAT_LABEL: Record<string, string> = {
  intake: 'Captacion',
  productivity: 'Productividad',
  billing: 'Facturacion',
  analytics: 'Analytics',
  compliance: 'Compliance',
  integration: 'Integraciones',
  ai: 'AI',
};

const TIER_COLOR: Record<string, string> = {
  free: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pro: 'bg-blue-50 text-blue-800 border-blue-200',
  enterprise: 'bg-purple-50 text-purple-800 border-purple-200',
};

export default function PluginsMarketplace() {
  const [items, setItems] = useState<PluginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'installed'>('all');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listPlugins({ installed_only: filter === 'installed' });
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);
  useEffect(() => { void reload(); }, [reload]);

  const handleToggle = async (p: PluginItem) => {
    setBusy(p.plugin_id);
    try {
      if (p.installation?.enabled) {
        await uninstallPlugin(p.plugin_id);
      } else {
        await installPlugin(p.plugin_id);
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="text-sm text-zinc-500 p-6">Cargando marketplace…</div>;
  if (error) return <div className="text-sm text-red-700 p-4 bg-red-50 rounded">{error}</div>;

  const grouped: Record<string, PluginItem[]> = {};
  for (const p of items) (grouped[p.category] ||= []).push(p);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Marketplace de plugins</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs rounded px-3 py-1.5 ${filter === 'all' ? 'bg-zinc-900 text-white' : 'border border-zinc-300 text-zinc-700'}`}
          >Todos</button>
          <button
            onClick={() => setFilter('installed')}
            className={`text-xs rounded px-3 py-1.5 ${filter === 'installed' ? 'bg-zinc-900 text-white' : 'border border-zinc-300 text-zinc-700'}`}
          >Instalados</button>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, ps]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
            {CAT_LABEL[cat] || cat} ({ps.length})
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ps.map((p) => {
              const installed = p.installation?.enabled;
              return (
                <li key={p.plugin_id} className="rounded-lg border border-zinc-200 bg-white p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-zinc-900 text-sm">{p.name}</h3>
                      <p className="text-xs text-zinc-600 line-clamp-2 mt-1">{p.short_description}</p>
                    </div>
                    <span className={`text-[10px] uppercase rounded border px-1.5 py-0.5 shrink-0 ${TIER_COLOR[p.pricing_tier]}`}>
                      {p.pricing_tier}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mb-2">v{p.version}</div>
                  <div className="flex gap-2 mt-auto">
                    <button
                      disabled={busy === p.plugin_id}
                      onClick={() => void handleToggle(p)}
                      className={`text-xs rounded px-3 py-1.5 flex-1 ${installed ? 'border border-zinc-300 text-zinc-700' : 'bg-zinc-900 text-white'} disabled:opacity-50`}
                    >
                      {busy === p.plugin_id ? '…' : (installed ? 'Desinstalar' : 'Instalar')}
                    </button>
                    {installed && p.route_path && (
                      <a href={p.route_path} className="text-xs rounded border border-zinc-300 text-zinc-700 px-3 py-1.5">
                        Abrir
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
