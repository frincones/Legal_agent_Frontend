'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';

type Metrics = {
  window_days: number;
  by_command: Array<{
    command: string;
    executions: number;
    success_count: number;
    error_count: number;
    blocked_count: number;
    avg_duration_ms: number;
    total_tokens_in: number;
    total_tokens_out: number;
    total_cost_cents: number;
  }>;
  by_firm: Array<{
    firm_id: string;
    executions: number;
    unique_users: number;
    total_cost_cents: number;
  }>;
};

export default function SaasSkillsMetricsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/saas/skills-metrics?days=${days}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <Link href="/saas/skills">Skills</Link> · <span className="text-accent">Métricas</span></>}
          title="Métricas de skills"
          subtitle="Uso por skill y por firma · útil para decidir qué publicar/deprecar"
          actions={
            <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="input">
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          }
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)] grid gap-4">
          {loading ? (
            <div className="surface p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando…</div>
          ) : data ? (
            <>
              <div className="surface p-4">
                <h3 className="serif text-[15px] font-semibold mb-3">Por skill</h3>
                <table className="w-full text-[12.5px]">
                  <thead className="bg-bg-2">
                    <tr>
                      <th className="text-left p-2">Command</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-right p-2">✓ Éxitos</th>
                      <th className="text-right p-2">✕ Errores</th>
                      <th className="text-right p-2">⛔ Bloqueados</th>
                      <th className="text-right p-2">Duración avg</th>
                      <th className="text-right p-2">Tokens (in/out)</th>
                      <th className="text-right p-2">Costo USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_command.map(r => (
                      <tr key={r.command} className="border-t hover:bg-bg-2">
                        <td className="p-2 mono">{r.command}</td>
                        <td className="p-2 text-right font-medium">{r.executions}</td>
                        <td className="p-2 text-right text-ok">{r.success_count}</td>
                        <td className="p-2 text-right text-danger">{r.error_count}</td>
                        <td className="p-2 text-right text-warn">{r.blocked_count}</td>
                        <td className="p-2 text-right">{r.avg_duration_ms ?? 0}ms</td>
                        <td className="p-2 text-right text-[11px]">{r.total_tokens_in?.toLocaleString()}/{r.total_tokens_out?.toLocaleString()}</td>
                        <td className="p-2 text-right">${((r.total_cost_cents || 0) / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                    {data.by_command.length === 0 && (
                      <tr><td colSpan={8} className="p-6 text-center muted">Sin ejecuciones en este periodo</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="surface p-4">
                <h3 className="serif text-[15px] font-semibold mb-3">Por firma</h3>
                <table className="w-full text-[12.5px]">
                  <thead className="bg-bg-2">
                    <tr>
                      <th className="text-left p-2">Firm ID</th>
                      <th className="text-right p-2">Ejecuciones</th>
                      <th className="text-right p-2">Usuarios únicos</th>
                      <th className="text-right p-2">Costo USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_firm.map(r => (
                      <tr key={r.firm_id} className="border-t hover:bg-bg-2">
                        <td className="p-2 mono text-[10.5px]">{r.firm_id?.slice(0, 8)}…</td>
                        <td className="p-2 text-right">{r.executions}</td>
                        <td className="p-2 text-right">{r.unique_users}</td>
                        <td className="p-2 text-right">${((r.total_cost_cents || 0) / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
