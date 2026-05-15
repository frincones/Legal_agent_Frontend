'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Plan = { code: string; name: string; monthly_cop: number };
type Module = {
  key: string; name: string; category: string;
  is_core: boolean; sort_order: number;
  by_plan: Record<string, boolean>;
};

const CATEGORY_LABEL: Record<string, string> = {
  core: 'Core', productivity: 'Productividad', ai: 'IA', docs: 'Documentos',
  calc: 'Calculadoras', collaboration: 'Colaboración', automation: 'Automatización',
  analytics: 'Analytics', integrations: 'Integraciones', client_facing: 'Cliente',
  billing: 'Facturación', marketplace: 'Marketplace', admin_only: 'Admin',
  experimental: 'Experimental',
};

const CATEGORY_CLS: Record<string, string> = {
  core: 'chip-ok', productivity: 'chip-accent', ai: 'chip-purple',
  docs: 'chip-neutral', calc: 'chip-neutral',
  collaboration: 'chip-accent', automation: 'chip-warn',
  analytics: 'chip-purple', integrations: 'chip-neutral',
  client_facing: 'chip-accent', billing: 'chip-warn',
  marketplace: 'chip-accent', admin_only: 'chip-bad', experimental: 'chip-warn',
};

export function ModulesMatrix() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, Record<string, boolean>>>({});
  // dirty[planCode][moduleKey] = newValue

  function load() {
    setLoading(true);
    fetch('/api/admin/matrix/modules', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) { setPlans(d.plans); setModules(d.modules); setDirty({}); }
      })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function toggle(planCode: string, moduleKey: string, currentValue: boolean) {
    setDirty((prev) => {
      const planPatch = prev[planCode] || {};
      const newValue = !(planPatch[moduleKey] ?? currentValue);
      if (newValue === currentValue) {
        // revert
        const { [moduleKey]: _, ...rest } = planPatch;
        return { ...prev, [planCode]: rest };
      }
      return { ...prev, [planCode]: { ...planPatch, [moduleKey]: newValue } };
    });
  }

  const dirtyCount = Object.values(dirty).reduce((acc, p) => acc + Object.keys(p).length, 0);

  async function saveAll() {
    if (dirtyCount === 0) return;
    let okCount = 0;
    for (const [planCode, patches] of Object.entries(dirty)) {
      if (Object.keys(patches).length === 0) continue;
      const items = Object.entries(patches).map(([module_key, enabled]) => ({ module_key, enabled }));
      const r = await fetch(`/api/admin/plans/${planCode}/modules`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (r.ok) okCount += items.length;
    }
    toast.success(`${okCount} cambios guardados`);
    load();
  }

  if (loading) {
    return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  }

  const grouped = modules.reduce((acc, m) => {
    (acc[m.category] = acc[m.category] || []).push(m);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="flex flex-col gap-3">
      {dirtyCount > 0 && (
        <div className="surface flex items-center justify-between gap-3 border-warn/40 bg-warn-soft p-3">
          <div className="text-[12.5px]">
            <strong>{dirtyCount}</strong> cambio(s) sin guardar
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={load}>Descartar</button>
            <button className="btn btn-primary btn-sm" onClick={saveAll}>
              <Save size={12} /> Guardar
            </button>
          </div>
        </div>
      )}

      <div className="surface overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead className="bg-bg-sunken sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left min-w-[280px]">Módulo</th>
              <th className="px-2 py-2">Categoría</th>
              {plans.map((p) => (
                <th key={p.code} className="px-2 py-2 text-center min-w-[80px]">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[10px] muted">
                    {p.monthly_cop === 0 ? 'Gratis' : `$${Math.round(p.monthly_cop / 1000)}k`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([cat, items]) => (
              <>
                <tr key={`cat-${cat}`}>
                  <td colSpan={plans.length + 2} className="bg-bg-elev/40 px-3 py-1.5">
                    <span className={cn('chip text-[10px]', CATEGORY_CLS[cat] || 'chip-neutral')}>
                      {CATEGORY_LABEL[cat] || cat}
                    </span>
                  </td>
                </tr>
                {items.map((m) => (
                  <tr key={m.key} className="border-t border-line/30">
                    <td className="px-3 py-1.5">
                      <div className="font-medium">{m.name}</div>
                      <div className="font-mono text-[10px] text-ink-3">{m.key}{m.is_core && ' · core'}</div>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] muted">{m.category}</td>
                    {plans.map((p) => {
                      const original = m.by_plan[p.code] ?? false;
                      const patched = dirty[p.code]?.[m.key];
                      const current = patched ?? original;
                      const isDirty = patched !== undefined && patched !== original;
                      return (
                        <td key={p.code} className="px-2 py-1.5 text-center">
                          <button
                            disabled={m.is_core}
                            onClick={() => toggle(p.code, m.key, original)}
                            className={cn(
                              'inline-flex h-5 w-9 items-center rounded-full transition-colors',
                              current ? 'bg-accent' : 'bg-bg-sunken',
                              isDirty && 'ring-2 ring-warn',
                              m.is_core && 'opacity-60 cursor-not-allowed',
                            )}
                          >
                            <span
                              className={cn(
                                'h-4 w-4 rounded-full bg-white transition-transform',
                                current ? 'translate-x-4' : 'translate-x-0.5',
                              )}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
