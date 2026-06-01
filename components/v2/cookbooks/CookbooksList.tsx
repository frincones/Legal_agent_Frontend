'use client';

import { useCallback, useEffect, useState } from 'react';
import { listCookbooks, runCookbook, type CookbookItem } from '@/lib/api/v2/cookbooks';

const CAT_LABEL: Record<string, string> = {
  corporate: 'Corporativo',
  litigation: 'Litigio',
  notarial: 'Notarial',
  transactional: 'Transaccional',
};

export default function CookbooksList() {
  const [items, setItems] = useState<CookbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<CookbookItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ status: string; summary: string } | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listCookbooks();
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  if (loading) return <div className="text-sm text-zinc-500 p-6">Cargando cookbooks…</div>;
  if (error) return <div className="text-sm text-red-700 p-4 bg-red-50 rounded">{error}</div>;

  const grouped: Record<string, CookbookItem[]> = {};
  for (const c of items) (grouped[c.category] ||= []).push(c);

  const openModal = (c: CookbookItem) => {
    setActive(c);
    setFormData({});
    setLastResult(null);
  };

  const submit = async () => {
    if (!active) return;
    setBusy(true);
    setLastResult(null);
    try {
      const r = await runCookbook(active.cookbook_id, formData);
      setLastResult({
        status: r.status,
        summary: `${r.steps_executed} pasos · ${r.duration_ms}ms${r.error_message ? ' · ' + r.error_message : ''}`,
      });
    } catch (e) {
      setLastResult({ status: 'error', summary: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Cookbooks · Recetas E2E</h1>
        <a href="/v2/cookbooks/runs" className="text-xs text-zinc-600 underline">Ver ejecuciones</a>
      </div>

      {Object.entries(grouped).map(([cat, cbs]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
            {CAT_LABEL[cat] || cat} ({cbs.length})
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cbs.map((c) => (
              <li key={c.cookbook_id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-medium text-zinc-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-zinc-600 mt-1">{c.short_description}</p>
                  </div>
                  <span className="text-[10px] uppercase rounded bg-zinc-100 text-zinc-600 px-1.5 py-0.5 shrink-0">
                    {c.pricing_tier} · ~{c.estimated_minutes}min
                  </span>
                </div>
                <button
                  onClick={() => openModal(c)}
                  className="text-xs bg-zinc-900 text-white rounded px-3 py-1.5 mt-2 hover:bg-zinc-800"
                >
                  Ejecutar receta
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold">{active.name}</h2>
              <button onClick={() => setActive(null)} className="text-zinc-500 hover:text-zinc-900">×</button>
            </div>
            <p className="text-sm text-zinc-600 mb-4">{active.short_description}</p>
            <form
              onSubmit={(e) => { e.preventDefault(); void submit(); }}
              className="space-y-3"
            >
              {Object.entries((active.inputs_schema as { properties?: Record<string, { type?: string; description?: string }> }).properties || {}).map(([key, schema]) => {
                const required = ((active.inputs_schema as { required?: string[] }).required || []).includes(key);
                return (
                  <div key={key}>
                    <label className="text-xs font-medium text-zinc-700 mb-1 block">
                      {key} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      required={required}
                      type={schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'}
                      value={formData[key] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      placeholder={schema.description}
                      className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                );
              })}
              {lastResult && (
                <div className={`text-xs rounded p-3 ${lastResult.status === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                  <strong>{lastResult.status}</strong> · {lastResult.summary}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit" disabled={busy}
                  className="rounded bg-zinc-900 text-white text-sm px-4 py-2 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {busy ? 'Ejecutando…' : 'Ejecutar'}
                </button>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded border border-zinc-300 text-zinc-700 text-sm px-4 py-2 hover:bg-zinc-50"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
