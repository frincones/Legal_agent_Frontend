'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listConnectors, subscribeConnector, unsubscribeConnector, probeConnector,
  type ConnectorItem,
} from '@/lib/api/v2/connectors';

const CAT_LABEL: Record<string, string> = {
  judicial: 'Judiciales',
  normativo: 'Normativos',
  fiscal: 'Fiscales',
  propiedad: 'Propiedad',
  registro: 'Registro',
  administrativo: 'Administrativos',
};

export default function ConnectorsList() {
  const [items, setItems] = useState<ConnectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listConnectors();
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const handleToggle = async (c: ConnectorItem) => {
    setBusy(c.connector_id);
    try {
      if (c.subscription?.enabled) {
        await unsubscribeConnector(c.connector_id);
      } else {
        await subscribeConnector(c.connector_id);
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleProbe = async (c: ConnectorItem) => {
    setBusy(c.connector_id);
    setProbeResults((s) => ({ ...s, [c.connector_id]: 'probing…' }));
    try {
      const r = await probeConnector(c.connector_id);
      setProbeResults((s) => ({ ...s, [c.connector_id]: `${r.status}${r.latency_ms ? ` · ${r.latency_ms}ms` : ''}` }));
    } catch (e) {
      setProbeResults((s) => ({ ...s, [c.connector_id]: 'error' }));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="text-sm text-zinc-500 p-6">Cargando connectors…</div>;
  if (error) return <div className="text-sm text-red-700 p-4 bg-red-50 rounded">{error}</div>;

  const grouped: Record<string, ConnectorItem[]> = {};
  for (const c of items) {
    (grouped[c.category] ||= []).push(c);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Conectores oficiales</h1>
        <span className="text-xs text-zinc-500">{items.length} conectores · {Object.keys(grouped).length} categorías</span>
      </div>
      {Object.entries(grouped).map(([cat, cs]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
            {CAT_LABEL[cat] || cat} ({cs.length})
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cs.map((c) => {
              const subscribed = c.subscription?.enabled;
              return (
                <li key={c.connector_id} className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-900 truncate">{c.name}</h3>
                        <code className="text-[10px] bg-zinc-100 text-zinc-600 px-1 py-0.5 rounded">{c.api_kind}</code>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{c.description}</p>
                      <div className="flex gap-1 flex-wrap mt-2">
                        {c.tags.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5">
                            {t}
                          </span>
                        ))}
                      </div>
                      {probeResults[c.connector_id] && (
                        <div className="text-[10px] text-blue-700 mt-2">→ {probeResults[c.connector_id]}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        disabled={busy === c.connector_id}
                        onClick={() => void handleToggle(c)}
                        className={`text-[11px] rounded px-2 py-1 ${subscribed ? 'border border-zinc-300 text-zinc-700' : 'bg-zinc-900 text-white'} disabled:opacity-50`}
                      >
                        {subscribed ? 'Desuscribir' : 'Suscribir'}
                      </button>
                      <button
                        disabled={busy === c.connector_id}
                        onClick={() => void handleProbe(c)}
                        className="text-[11px] rounded border border-zinc-300 text-zinc-700 px-2 py-1 disabled:opacity-50"
                      >
                        Probe
                      </button>
                    </div>
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
