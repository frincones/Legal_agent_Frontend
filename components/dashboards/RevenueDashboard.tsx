'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';

function formatCOPCompact(v: number): string {
  const safe = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  if (Math.abs(safe) >= 1_000_000) return `$${(safe / 1_000_000).toFixed(1)}M`;
  if (Math.abs(safe) >= 1_000) return `$${Math.round(safe / 1_000)}K`;
  return `$${Math.round(safe)}`;
}
import { DualBarChart, DonutChart, KpiCard } from '@/components/charts/primitives';

type TrendItem = {
  month: string;
  invoiced_cop: number;
  collected_cop: number;
  outstanding_cop: number;
  invoices_count: number;
};
type Aging = Record<string, { amount: number; count: number }>;
type ExecKpis = {
  invoiced_mtd_cop?: number;
  collected_mtd_cop?: number;
  ar_total_cop?: number;
  ar_overdue_cop?: number;
};

const AGING_LABEL: Record<string, string> = {
  current: 'Al día',
  d1_30: '1-30 días',
  d31_60: '31-60 días',
  d61_90: '61-90 días',
  d90_plus: '+90 días',
  no_due: 'Sin fecha',
};

const AGING_COLORS: Record<string, string> = {
  current: 'rgb(var(--ok-rgb))',
  d1_30: 'rgb(var(--accent-rgb))',
  d31_60: 'rgb(var(--warn-rgb))',
  d61_90: 'rgb(var(--danger-rgb))',
  d90_plus: 'rgb(var(--danger-rgb))',
  no_due: 'rgb(var(--ink-3-rgb))',
};

export function RevenueDashboard() {
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [aging, setAging] = useState<Aging>({});
  const [kpis, setKpis] = useState<ExecKpis>({});
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [t, a, k] = await Promise.all([
        fetch(`/api/analytics-v2/revenue-trend?months=${months}`, { cache: 'no-store' }),
        fetch('/api/analytics-v2/ar-aging', { cache: 'no-store' }),
        fetch('/api/analytics-v2/executive-kpis', { cache: 'no-store' }),
      ]);
      if (t.ok) setTrend((await t.json()).items || []);
      if (a.ok) setAging(await a.json());
      if (k.ok) setKpis(await k.json());
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => {
    const inv = trend.reduce((s, t) => s + t.invoiced_cop, 0);
    const col = trend.reduce((s, t) => s + t.collected_cop, 0);
    return {
      inv,
      col,
      realization: inv ? Math.round((col / inv) * 1000) / 10 : 0,
      trendInvoiced: trend.map((t) => t.invoiced_cop),
      trendCollected: trend.map((t) => t.collected_cop),
    };
  }, [trend]);

  const agingSegments = useMemo(
    () => Object.entries(aging || {}).map(([k, v]) => ({
      label: AGING_LABEL[k] || k,
      value: v.amount,
      color: AGING_COLORS[k],
    })),
    [aging],
  );

  const monthLabels = useMemo(
    () => trend.map((t) => t.month ? new Date(t.month).toLocaleDateString('es-CO', { month: 'short' }) : ''),
    [trend],
  );

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={24} /></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Facturado este mes"
          value={formatCOP(kpis.invoiced_mtd_cop || 0)}
          sub={`${monthLabels[monthLabels.length - 1] || ''}`}
          trend={totals.trendInvoiced}
          tone="accent"
        />
        <KpiCard
          label="Cobrado este mes"
          value={formatCOP(kpis.collected_mtd_cop || 0)}
          sub="MTD"
          trend={totals.trendCollected}
          tone="ok"
        />
        <KpiCard
          label="Cuenta por cobrar"
          value={formatCOP(kpis.ar_total_cop || 0)}
          sub="total pendiente"
        />
        <KpiCard
          label="Vencido"
          value={formatCOP(kpis.ar_overdue_cop || 0)}
          sub={kpis.ar_overdue_cop ? 'requiere cobranza' : 'al día'}
          tone={kpis.ar_overdue_cop ? 'danger' : 'ok'}
        />
      </div>

      {/* Revenue trend (dual bar) */}
      <section className="surface p-[var(--pad-card)]">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="serif m-0 text-[14.5px] font-semibold">Tendencia · facturado vs cobrado</h3>
            <p className="text-[11.5px] muted">Últimos {months} meses</p>
          </div>
          <select
            className="input w-auto text-[11px]"
            value={months}
            onChange={(ev) => setMonths(parseInt(ev.target.value))}
          >
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
            <option value="24">24 meses</option>
          </select>
        </header>
        <DualBarChart
          labels={monthLabels}
          seriesA={totals.trendInvoiced}
          seriesB={totals.trendCollected}
          labelA="Facturado"
          labelB="Cobrado"
          formatValue={(v) => formatCOPCompact(v)}
        />
        <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-3">
          <span>Realización promedio: <span className="font-semibold text-ink-2">{totals.realization}%</span></span>
          <span>{trend.reduce((s, t) => s + t.invoices_count, 0)} facturas en el periodo</span>
        </div>
      </section>

      {/* AR aging donut */}
      <section className="surface p-[var(--pad-card)]">
        <header className="mb-3">
          <h3 className="serif m-0 text-[14.5px] font-semibold">AR aging · ¿cuánto está vencido?</h3>
          <p className="text-[11.5px] muted">Balance pendiente por antigüedad de la fecha de vencimiento</p>
        </header>
        <DonutChart
          segments={agingSegments}
          formatValue={(v) => formatCOPCompact(v)}
          centerValue={formatCOPCompact(agingSegments.reduce((s, x) => s + x.value, 0))}
          centerLabel="Total AR"
        />
      </section>
    </div>
  );
}
