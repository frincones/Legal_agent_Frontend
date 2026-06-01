'use client';

/** Sprint M21.S4.G · AgentsDashboard · catalog + run/toggle por agent. */

import { useCallback, useEffect, useState } from 'react';
import {
  listAgents, runAgentNow, toggleAgent,
  type AgentCatalogItem,
} from '@/lib/api/v2/agents';

export default function AgentsDashboard() {
  const [items, setItems] = useState<AgentCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listAgents();
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const handleRun = async (name: string) => {
    setBusy(name);
    setLastResult((s) => ({ ...s, [name]: 'corriendo…' }));
    try {
      const r = await runAgentNow(name);
      setLastResult((s) => ({
        ...s,
        [name]: `${r.status} · ${r.output_summary || '—'}`,
      }));
      await reload();
    } catch (e) {
      setLastResult((s) => ({ ...s, [name]: `error: ${e instanceof Error ? e.message : String(e)}` }));
    } finally {
      setBusy(null);
    }
  };

  const handleToggle = async (name: string, current: boolean) => {
    setBusy(name);
    try {
      await toggleAgent(name, !current);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="text-sm text-zinc-500 p-6">Cargando agentes…</div>;
  if (error) return (
    <div className="rounded bg-red-50 text-red-700 p-4 text-sm">
      {error}
      <button onClick={() => void reload()} className="ml-3 underline">Reintentar</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Background Agents</h1>
        <span className="text-xs text-zinc-500">{items.length} agentes registrados</span>
      </div>

      <ul className="space-y-3">
        {items.map((a) => {
          const enabled = a.job?.enabled !== false;
          const last = a.job?.last_run_status;
          const lastAt = a.job?.last_run_at ? new Date(a.job.last_run_at).toLocaleString() : null;
          return (
            <li key={a.name} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-zinc-900">{a.name}</h3>
                    <span className="text-[10px] uppercase rounded bg-zinc-100 text-zinc-600 px-1.5 py-0.5">
                      {a.trigger_kind}
                    </span>
                    {a.default_cron && (
                      <code className="text-[10px] rounded bg-amber-50 text-amber-800 px-1.5 py-0.5">
                        {a.default_cron}
                      </code>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600 mt-1">{a.description}</p>
                  <div className="text-xs text-zinc-500 mt-2 flex items-center gap-3 flex-wrap">
                    <span>
                      Estado:&nbsp;
                      <span className={`font-medium ${enabled ? 'text-emerald-700' : 'text-zinc-500'}`}>
                        {enabled ? 'activo' : 'pausado'}
                      </span>
                    </span>
                    {last && (
                      <span>Última: <strong className={last === 'ok' ? 'text-emerald-700' : last === 'error' ? 'text-red-700' : 'text-zinc-600'}>{last}</strong> {lastAt && `· ${lastAt}`}</span>
                    )}
                    {lastResult[a.name] && (
                      <span className="text-blue-700">→ {lastResult[a.name]}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    disabled={busy === a.name}
                    onClick={() => void handleRun(a.name)}
                    className="rounded bg-zinc-900 text-white text-xs px-3 py-1.5 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {busy === a.name ? '…' : 'Ejecutar ahora'}
                  </button>
                  <button
                    disabled={busy === a.name}
                    onClick={() => void handleToggle(a.name, enabled)}
                    className="rounded border border-zinc-300 text-zinc-700 text-xs px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {enabled ? 'Pausar' : 'Activar'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
