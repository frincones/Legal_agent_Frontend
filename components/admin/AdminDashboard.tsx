'use client';

import { useEffect, useState } from 'react';
import { Building2, DollarSign, Loader2, LifeBuoy, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

type Overview = {
  mrr: { mrr_cop: number; arr_cop: number; arpu_cop: number; paying_firms: number; trialing_firms: number; past_due_firms: number };
  signups: { signups_mtd: number; signups_prev_month: number; total_firms: number; growth_pct: number | null };
  churn: { churned_30d: number; base_30d: number; churn_rate_pct: number };
  cartera: { cartera_total: number; recaudado_mtd: number };
  tickets: { open: number; in_progress: number; active: number };
};

type TimeSeries = { month_start: string; signups: number; active_subs: number; mrr_cop: number };
type PlanDist = { plan_code: string; plan_name: string; firms_count: number; active: number; trialing: number; past_due: number; canceled: number };

function formatCOP(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

export function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [series, setSeries] = useState<TimeSeries[]>([]);
  const [plans, setPlans] = useState<PlanDist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/metrics/overview', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/metrics/timeseries?months=6', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { items: [] })),
      fetch('/api/admin/metrics/plan-distribution', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { items: [] })),
    ]).then(([ov, ts, pd]) => {
      setOverview(ov);
      setSeries(ts?.items || []);
      setPlans(pd?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-8 text-[13px] muted">
        <Loader2 className="animate-spin" size={14} /> Cargando métricas SaaS…
      </div>
    );
  }
  if (!overview) {
    return <div className="surface p-8 text-center text-[13px] muted">No se pudieron cargar las métricas.</div>;
  }

  const growth = overview.signups?.growth_pct;
  return (
    <div className="flex flex-col gap-5">
      {/* KPIs principales */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard
          icon={<DollarSign size={16} />}
          label="MRR"
          value={formatCOP(overview.mrr?.mrr_cop || 0)}
          sub={`ARR ${formatCOP(overview.mrr?.arr_cop || 0)}`}
          tone="ok"
        />
        <KpiCard
          icon={<Users size={16} />}
          label="Firms pagando"
          value={String(overview.mrr?.paying_firms || 0)}
          sub={`Trial: ${overview.mrr?.trialing_firms || 0} · Past due: ${overview.mrr?.past_due_firms || 0}`}
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Signups MTD"
          value={String(overview.signups?.signups_mtd || 0)}
          sub={growth !== null && growth !== undefined
            ? `${growth > 0 ? '+' : ''}${growth}% vs mes anterior`
            : 'Sin datos previos'}
          tone={growth && growth >= 0 ? 'ok' : 'warn'}
        />
        <KpiCard
          icon={<TrendingDown size={16} />}
          label="Churn 30d"
          value={`${overview.churn?.churn_rate_pct || 0}%`}
          sub={`${overview.churn?.churned_30d || 0} canceladas`}
          tone={overview.churn?.churn_rate_pct > 5 ? 'bad' : 'ok'}
        />
      </div>

      {/* Cartera + Tickets */}
      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard
          icon={<Wallet size={16} />}
          label="Cartera total"
          value={formatCOP(overview.cartera?.cartera_total || 0)}
          sub={`Recaudado MTD: ${formatCOP(overview.cartera?.recaudado_mtd || 0)}`}
        />
        <KpiCard
          icon={<Building2 size={16} />}
          label="Total firms"
          value={String(overview.signups?.total_firms || 0)}
          sub="Acumulado histórico"
        />
        <KpiCard
          icon={<LifeBuoy size={16} />}
          label="Tickets activos"
          value={String(overview.tickets?.active || 0)}
          sub={`Open: ${overview.tickets?.open || 0} · WIP: ${overview.tickets?.in_progress || 0}`}
          tone={overview.tickets?.active > 5 ? 'warn' : undefined}
        />
      </div>

      {/* MRR timeseries */}
      <section className="surface p-5">
        <h3 className="serif mb-3 text-[15px] font-semibold">MRR · últimos 6 meses</h3>
        <MRRChart series={series} />
      </section>

      {/* Plan distribution */}
      <section className="surface p-5">
        <h3 className="serif mb-3 text-[15px] font-semibold">Distribución por plan</h3>
        <div className="grid gap-2">
          {plans.map((p) => (
            <div key={p.plan_code} className="flex items-center gap-3 border-b border-line/30 py-2 last:border-0">
              <div className="w-24 shrink-0">
                <div className="text-[13px] font-medium">{p.plan_name}</div>
                <div className="text-[10.5px] muted">{p.plan_code}</div>
              </div>
              <div className="flex flex-1 gap-1.5 text-[10.5px]">
                <Bar count={p.active} total={p.firms_count} className="bg-ok" label={`${p.active} activas`} />
                <Bar count={p.trialing} total={p.firms_count} className="bg-accent" label={`${p.trialing} trial`} />
                <Bar count={p.past_due} total={p.firms_count} className="bg-warn" label={`${p.past_due} past due`} />
                <Bar count={p.canceled} total={p.firms_count} className="bg-ink-3" label={`${p.canceled} canceladas`} />
              </div>
              <div className="w-12 shrink-0 text-right font-mono text-[13px]">{p.firms_count}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'ok' | 'warn' | 'bad';
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-3">
        {icon} {label}
      </div>
      <div className={cn('serif mt-1 text-[24px] font-semibold leading-none',
        tone === 'ok' && 'text-ok',
        tone === 'warn' && 'text-warn',
        tone === 'bad' && 'text-bad',
      )}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[10.5px] muted">{sub}</div>}
    </div>
  );
}

function Bar({ count, total, className, label }: { count: number; total: number; className: string; label: string }) {
  if (!count) return null;
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div
      className={cn('h-5 rounded text-center text-[9px] font-medium leading-5 text-white', className)}
      style={{ width: `${Math.max(8, pct)}%` }}
      title={label}
    >
      {count > 1 ? count : ''}
    </div>
  );
}

function MRRChart({ series }: { series: TimeSeries[] }) {
  if (!series.length) return <div className="text-[12px] muted">Sin datos suficientes aún.</div>;
  const max = Math.max(...series.map((s) => s.mrr_cop), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {series.map((s) => {
        const h = (s.mrr_cop / max) * 100;
        return (
          <div key={s.month_start} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full bg-accent rounded-t" style={{ height: `${h}%` }} title={formatCOP(s.mrr_cop)} />
            <div className="text-[10px] muted">
              {new Date(s.month_start).toLocaleDateString('es-CO', { month: 'short' })}
            </div>
            <div className="text-[10px] font-mono">{formatCOP(s.mrr_cop)}</div>
          </div>
        );
      })}
    </div>
  );
}
