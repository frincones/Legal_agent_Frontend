'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Plan = { code: string; name: string; monthly_cop: number };
type QuotaCell = { limit_value: number | null; soft_cap_pct: number };
type Quota = {
  key: string; name: string; unit: string;
  reset_period: string; enforcement: string;
  by_plan: Record<string, QuotaCell>;
};

export function QuotasMatrix() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, Record<string, QuotaCell>>>({});

  function load() {
    setLoading(true);
    fetch('/api/admin/matrix/quotas', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setPlans(d.plans); setQuotas(d.quotas); setDirty({}); } })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function update(planCode: string, quotaKey: string, value: string) {
    const num = value === '' ? null : Number(value);
    if (value !== '' && (isNaN(num as number) || (num as number) < 0)) return;
    setDirty((prev) => ({
      ...prev,
      [planCode]: { ...(prev[planCode] || {}), [quotaKey]: { limit_value: num, soft_cap_pct: 80 } },
    }));
  }

  const dirtyCount = Object.values(dirty).reduce((acc, p) => acc + Object.keys(p).length, 0);

  async function saveAll() {
    if (dirtyCount === 0) return;
    let okCount = 0;
    for (const [planCode, patches] of Object.entries(dirty)) {
      const items = Object.entries(patches).map(([quota_type_key, cell]) => ({
        quota_type_key, limit_value: cell.limit_value, soft_cap_pct: cell.soft_cap_pct,
      }));
      if (items.length === 0) continue;
      const r = await fetch(`/api/admin/plans/${planCode}/quotas`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (r.ok) okCount += items.length;
    }
    toast.success(`${okCount} cuotas guardadas`);
    load();
  }

  if (loading) return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;

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
        <table className="w-full text-[12px]">
          <thead className="bg-bg-sunken">
            <tr>
              <th className="px-3 py-2 text-left min-w-[260px]">Cuota</th>
              <th className="px-2 py-2 text-left">Periodo</th>
              {plans.map((p) => (
                <th key={p.code} className="px-2 py-2 text-center min-w-[100px]">
                  <div className="font-semibold">{p.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotas.map((q) => (
              <tr key={q.key} className="border-t border-line/30">
                <td className="px-3 py-1.5">
                  <div className="font-medium">{q.name}</div>
                  <div className="font-mono text-[10px] muted">{q.key} · {q.unit} · {q.enforcement}</div>
                </td>
                <td className="px-2 py-1.5 text-[10.5px] muted">{q.reset_period}</td>
                {plans.map((p) => {
                  const original = q.by_plan[p.code] || { limit_value: 0, soft_cap_pct: 80 };
                  const patched = dirty[p.code]?.[q.key];
                  const current = patched ?? original;
                  const isDirty = !!patched;
                  return (
                    <td key={p.code} className="px-2 py-1.5 text-center">
                      <input
                        type="text"
                        className={cn(
                          'input text-center w-20 mono text-[11px]',
                          isDirty && 'ring-2 ring-warn',
                        )}
                        placeholder="∞"
                        value={current.limit_value === null ? '' : current.limit_value}
                        onChange={(e) => update(p.code, q.key, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] muted">
        Tip: deja vacío para ilimitado · pon 0 para bloquear acceso completamente.
      </div>
    </div>
  );
}
