'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, BarChart3, Briefcase, CalendarClock, ClipboardList, Loader2, TrendingUp } from 'lucide-react';
import { MiniBarChart } from './MiniBarChart';
import { MiniLineChart } from './MiniLineChart';

type Kpis = {
  matters_total: number;
  matters_active: number;
  matters_new: number;
  clients_total: number;
  clients_new: number;
  deadlines_upcoming: number;
  deadlines_overdue: number;
  deadlines_done: number;
  docs_uploaded: number;
  by_materia: Record<string, number>;
  by_status: Record<string, number>;
  by_owner: Record<string, number>;
  period_days: number;
  generated_at: string;
};
type LawyerRow = {
  user_id: string;
  full_name: string;
  role: string;
  matters_total: number;
  matters_active: number;
  matters_new: number;
  deadlines_done: number;
  deadlines_overdue: number;
};
type TimelineRow = { day: string; matters_created: number; docs_uploaded: number; deadlines_done: number };

export function ReportsDashboard() {
  const [days, setDays] = useState(30);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [lawyers, setLawyers] = useState<LawyerRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [k, l, t] = await Promise.all([
        fetch(`/api/analytics/kpis?days=${days}`, { cache: 'no-store' }),
        fetch(`/api/analytics/lawyers?days=${days}`, { cache: 'no-store' }),
        fetch(`/api/analytics/timeline?days=${days}`, { cache: 'no-store' }),
      ]);
      if (k.ok) setKpis(await k.json());
      if (l.ok) setLawyers((await l.json()).items || []);
      if (t.ok) setTimeline((await t.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando reportes…
      </div>
    );
  }

  const materiaBars = kpis ? Object.entries(kpis.by_materia || {}).slice(0, 8).map(([label, value]) => ({ label, value })) : [];
  const statusBars = kpis ? Object.entries(kpis.by_status || {}).slice(0, 6).map(([label, value]) => ({ label, value })) : [];

  const mattersLine = timeline.map((t) => ({ label: t.day.slice(5), value: t.matters_created }));
  const docsLine = timeline.map((t) => ({ label: t.day.slice(5), value: t.docs_uploaded }));
  const deadlinesLine = timeline.map((t) => ({ label: t.day.slice(5), value: t.deadlines_done }));

  return (
    <div className="grid gap-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] uppercase tracking-wider muted">Periodo:</span>
        <div className="inline-flex rounded-md border border-line p-0.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded px-3 py-1 text-[12px] font-medium ${days === d ? 'bg-accent text-white' : 'text-ink-2'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Tile label="Casos activos" v={kpis?.matters_active ?? 0} icon={<Briefcase size={14} className="text-accent" aria-hidden="true" />} />
        <Tile label="Casos nuevos" v={kpis?.matters_new ?? 0} icon={<TrendingUp size={14} className="text-emerald-500" aria-hidden="true" />} />
        <Tile label="Plazos vencidos" v={kpis?.deadlines_overdue ?? 0} icon={<CalendarClock size={14} className="text-red-500" aria-hidden="true" />} highlight={kpis?.deadlines_overdue ? 'red' : null} />
        <Tile label="Plazos próx. 14d" v={kpis?.deadlines_upcoming ?? 0} icon={<CalendarClock size={14} className="text-amber-500" aria-hidden="true" />} />
        <Tile label="Docs subidos" v={kpis?.docs_uploaded ?? 0} icon={<ClipboardList size={14} className="text-purple-500" aria-hidden="true" />} />
      </div>

      {/* Timeline charts */}
      <div className="grid gap-3 md:grid-cols-3">
        <ChartCard title="Casos creados" icon={<TrendingUp size={12} aria-hidden="true" />}>
          <MiniLineChart points={mattersLine} color="#3b82f6" />
        </ChartCard>
        <ChartCard title="Documentos subidos" icon={<ClipboardList size={12} aria-hidden="true" />}>
          <MiniLineChart points={docsLine} color="#a855f7" />
        </ChartCard>
        <ChartCard title="Plazos cumplidos" icon={<CalendarClock size={12} aria-hidden="true" />}>
          <MiniLineChart points={deadlinesLine} color="#10b981" />
        </ChartCard>
      </div>

      {/* Distribution charts */}
      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard title="Por materia" icon={<BarChart3 size={12} aria-hidden="true" />}>
          <MiniBarChart bars={materiaBars} />
        </ChartCard>
        <ChartCard title="Por estado" icon={<Activity size={12} aria-hidden="true" />}>
          <MiniBarChart bars={statusBars} />
        </ChartCard>
      </div>

      {/* Lawyers table */}
      <section className="surface p-3">
        <div className="serif mb-2 text-[14px] font-semibold">Performance por abogado</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider muted">
                <th className="py-2">Nombre</th>
                <th className="py-2">Rol</th>
                <th className="py-2 text-right">Activos</th>
                <th className="py-2 text-right">Nuevos</th>
                <th className="py-2 text-right">Plazos OK</th>
                <th className="py-2 text-right">Vencidos</th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((l) => (
                <tr key={l.user_id} className="border-t border-line text-[12.5px]">
                  <td className="py-2 font-semibold">{l.full_name}</td>
                  <td className="py-2 muted">{l.role}</td>
                  <td className="py-2 text-right">{l.matters_active}</td>
                  <td className="py-2 text-right text-emerald-500">{l.matters_new}</td>
                  <td className="py-2 text-right">{l.deadlines_done}</td>
                  <td className={`py-2 text-right ${l.deadlines_overdue > 0 ? 'text-red-500 font-semibold' : ''}`}>
                    {l.deadlines_overdue}
                  </td>
                </tr>
              ))}
              {lawyers.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-center text-[12px] muted">Sin datos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, v, icon, highlight }: { label: string; v: number; icon: JSX.Element; highlight?: 'red' | null }) {
  return (
    <div className={`surface p-3 ${highlight === 'red' ? 'border-red-500/30 ring-1 ring-red-500/20' : ''}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider muted">
        {icon} {label}
      </div>
      <div className="serif text-[22px] font-semibold">{v}</div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: JSX.Element; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="mb-2 flex items-center gap-2 text-[11.5px] uppercase tracking-wider muted">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
