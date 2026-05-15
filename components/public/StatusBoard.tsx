'use client';

import { useEffect, useState } from 'react';
import { Check, AlertCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

type Component = {
  key: string; name: string; description: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  status_since: string;
  uptime_30d_pct: number;
};

type Incident = {
  id: string; title: string; body: string; impact: string;
  status: string; components: string[];
  started_at: string; resolved_at: string | null;
};

type Summary = {
  overall_status: string;
  components: Component[];
  recent_incidents: Incident[];
  snapshot_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  operational: { label: 'Operacional', cls: 'text-ok', icon: Check },
  degraded: { label: 'Degradado', cls: 'text-warn', icon: AlertCircle },
  partial_outage: { label: 'Caída parcial', cls: 'text-warn', icon: AlertTriangle },
  major_outage: { label: 'Caída mayor', cls: 'text-bad', icon: XCircle },
  maintenance: { label: 'Mantenimiento', cls: 'text-accent', icon: Wrench },
};

export function StatusBoard({ initialData }: { initialData: { summary: Summary | null; incidents: Incident[] } }) {
  const [summary, setSummary] = useState(initialData.summary);
  const [incidents, setIncidents] = useState(initialData.incidents);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [sumR, incR] = await Promise.all([
          fetch('/api/public/status', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
          fetch('/api/public/status/incidents?limit=10', { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
        ]);
        if (sumR) setSummary(sumR);
        if (incR?.items) setIncidents(incR.items);
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!summary) {
    return (
      <div className="surface p-6 text-center text-[13px] muted">
        Cargando estado…
      </div>
    );
  }

  const overall = STATUS_META[summary.overall_status] || STATUS_META.operational!;
  const OverallIcon = overall.icon;

  return (
    <div className="flex flex-col gap-5">
      {/* Overall banner */}
      <div className={cn('surface p-5 border-l-4',
        summary.overall_status === 'operational' ? 'border-ok' :
        summary.overall_status === 'major_outage' ? 'border-bad' :
        'border-warn')}>
        <div className="flex items-center gap-3">
          <OverallIcon size={24} className={overall.cls} />
          <div>
            <h2 className="serif text-[18px] font-semibold">
              {summary.overall_status === 'operational'
                ? 'Todos los sistemas operacionales'
                : `Estado: ${overall.label}`}
            </h2>
            <div className="text-[11px] muted">
              Última actualización: {new Date(summary.snapshot_at).toLocaleTimeString('es-CO')}
            </div>
          </div>
        </div>
      </div>

      {/* Components */}
      <section className="surface p-5">
        <h3 className="serif mb-3 text-[15px] font-semibold">Componentes</h3>
        <ul className="grid gap-2">
          {summary.components.map((c) => {
            const meta = STATUS_META[c.status] || STATUS_META.operational!;
            const Icon = meta.icon;
            return (
              <li key={c.key} className="flex items-center gap-3 border-b border-line/30 py-2 last:border-0">
                <Icon size={16} className={cn('shrink-0', meta.cls)} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[13px]">{c.name}</div>
                  <div className="text-[11px] muted truncate">{c.description}</div>
                </div>
                <div className="text-right">
                  <div className={cn('text-[12px] font-medium', meta.cls)}>{meta.label}</div>
                  <div className="text-[10.5px] muted">
                    Uptime 30d: {Math.round(c.uptime_30d_pct * 100) / 100}%
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Incidents */}
      <section className="surface p-5">
        <h3 className="serif mb-3 text-[15px] font-semibold">Incidentes recientes (últimos 90 días)</h3>
        {incidents.length === 0 ? (
          <div className="text-center text-[12.5px] muted py-4">
            Sin incidentes reportados.
          </div>
        ) : (
          <ul className="grid gap-3">
            {incidents.map((i) => (
              <li key={i.id} className="rounded-md border border-line p-3">
                <header className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-[13px]">{i.title}</strong>
                  <span className={cn('chip text-[10px]',
                    i.status === 'resolved' ? 'chip-ok' :
                    i.impact === 'critical' ? 'chip-bad' :
                    i.impact === 'major' ? 'chip-warn' : 'chip-neutral')}>
                    {i.status}
                  </span>
                </header>
                {i.body && <p className="text-[11.5px] muted">{i.body}</p>}
                <footer className="mt-1 flex gap-2 text-[10.5px] muted">
                  <span>Inicio: {new Date(i.started_at).toLocaleString('es-CO')}</span>
                  {i.resolved_at && <span>· Resuelto: {new Date(i.resolved_at).toLocaleString('es-CO')}</span>}
                </footer>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
