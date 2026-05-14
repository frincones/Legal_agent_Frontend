'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';
import { BarChart, KpiCard } from '@/components/charts/primitives';

type Lawyer = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  billable_minutes: number;
  non_billable_minutes: number;
  billable_hours: number;
  utilization_pct: number;
  matters_count: number;
  invoiced_cop: number;
  tasks_completed: number;
};

function formatCOPCompact(v: number): string {
  const safe = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  if (Math.abs(safe) >= 1_000_000) return `$${(safe / 1_000_000).toFixed(1)}M`;
  if (Math.abs(safe) >= 1_000) return `$${Math.round(safe / 1_000)}K`;
  return `$${Math.round(safe)}`;
}

export function PerformanceDashboard() {
  const [items, setItems] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/analytics-v2/performance?days=${days}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => ({
    billable_min: items.reduce((s, l) => s + l.billable_minutes, 0),
    non_billable_min: items.reduce((s, l) => s + l.non_billable_minutes, 0),
    invoiced: items.reduce((s, l) => s + l.invoiced_cop, 0),
    tasks: items.reduce((s, l) => s + l.tasks_completed, 0),
  }), [items]);

  const utilizationTotal = useMemo(() => {
    const total = totals.billable_min + totals.non_billable_min;
    return total > 0 ? Math.round((totals.billable_min / total) * 1000) / 10 : 0;
  }, [totals]);

  const barData = useMemo(
    () => items.slice(0, 10).map((l) => ({
      label: l.full_name.split(' ')[0] || '?',
      value: l.billable_hours,
      tone: 'accent' as const,
    })),
    [items],
  );

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={24} /></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Horas facturables"
          value={Math.round(totals.billable_min / 60)}
          sub={`${days} días`}
          tone="accent"
        />
        <KpiCard
          label="Utilización"
          value={`${utilizationTotal}%`}
          sub="billable / total"
          tone={utilizationTotal >= 70 ? 'ok' : utilizationTotal >= 50 ? 'warn' : 'danger'}
        />
        <KpiCard
          label="Facturado por horas"
          value={formatCOPCompact(totals.invoiced)}
          sub="trabajo facturado en el periodo"
        />
        <KpiCard
          label="Tareas completadas"
          value={totals.tasks}
          sub={`${days} días`}
        />
      </div>

      {/* Bar chart: top 10 por billable hours */}
      <section className="surface p-[var(--pad-card)]">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="serif m-0 text-[14.5px] font-semibold">Horas facturables · top 10</h3>
            <p className="text-[11.5px] muted">Por abogado, últimos {days} días</p>
          </div>
          <select className="input w-auto text-[11px]"
            value={days} onChange={(ev) => setDays(parseInt(ev.target.value))}>
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="60">60 días</option>
            <option value="90">90 días</option>
          </select>
        </header>
        <BarChart data={barData} formatValue={(v) => `${v}h`} />
      </section>

      {/* Tabla detalle */}
      <section className="surface p-[var(--pad-card)]">
        <header className="mb-2">
          <h3 className="serif m-0 text-[14.5px] font-semibold">Detalle por abogado</h3>
          <p className="text-[11.5px] muted">Horas, casos asignados, facturado y tareas hechas</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wider text-ink-3">
                <th className="py-1.5 pr-2">Abogado</th>
                <th className="py-1.5 pr-2 text-right">Horas facturables</th>
                <th className="py-1.5 pr-2 text-right">No facturable</th>
                <th className="py-1.5 pr-2 text-right">Utilización</th>
                <th className="py-1.5 pr-2 text-right">Casos</th>
                <th className="py-1.5 pr-2 text-right">Facturado</th>
                <th className="py-1.5 pr-2 text-right">Tareas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.user_id} className="border-b border-line/40">
                  <td className="py-1.5 pr-2 font-medium">{l.full_name}</td>
                  <td className="py-1.5 pr-2 text-right tabular">{l.billable_hours}</td>
                  <td className="py-1.5 pr-2 text-right tabular text-ink-3">
                    {Math.round(l.non_billable_minutes / 60 * 10) / 10}
                  </td>
                  <td className={cn('py-1.5 pr-2 text-right tabular',
                    l.utilization_pct >= 70 ? 'text-ok' : l.utilization_pct >= 50 ? 'text-warn' : 'text-danger',
                  )}>
                    {l.utilization_pct}%
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular">{l.matters_count}</td>
                  <td className="py-1.5 pr-2 text-right tabular">{formatCOP(l.invoiced_cop)}</td>
                  <td className="py-1.5 pr-2 text-right tabular">{l.tasks_completed}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-[12px] muted">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
