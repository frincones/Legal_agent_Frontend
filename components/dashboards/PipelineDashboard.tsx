'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';
import { FunnelChart, KpiCard } from '@/components/charts/primitives';

type Stage = { stage: string; count: number; amount_cop: number };

const STAGE_LABEL: Record<string, string> = {
  leads_open: 'Leads abiertos',
  leads_won: 'Leads ganados',
  matters_active: 'Casos activos',
  matters_closed: 'Casos cerrados',
};

export function PipelineDashboard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [conv, setConv] = useState(0);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/analytics-v2/pipeline?days=${days}`, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setStages(data.stages || []);
        setConv(data.conversion_rate_pct || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void refresh(); }, [refresh]);

  const labels = useMemo(
    () => stages.map((s) => ({ label: STAGE_LABEL[s.stage] || s.stage, value: s.count })),
    [stages],
  );

  const totals = useMemo(() => ({
    leadsOpen: stages.find((s) => s.stage === 'leads_open')?.count || 0,
    leadsWon: stages.find((s) => s.stage === 'leads_won')?.count || 0,
    mattersActive: stages.find((s) => s.stage === 'matters_active')?.count || 0,
    mattersClosed: stages.find((s) => s.stage === 'matters_closed')?.count || 0,
    pipelineValue: stages.reduce((s, x) => s + (x.amount_cop || 0), 0),
  }), [stages]);

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={24} /></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Leads abiertos" value={totals.leadsOpen} sub={`últimos ${days} días`} tone="accent" />
        <KpiCard label="Leads ganados" value={totals.leadsWon} tone="ok" />
        <KpiCard label="Conversión" value={`${conv}%`} sub="closed / leads" />
        <KpiCard label="Valor pipeline" value={formatCOP(totals.pipelineValue)} />
      </div>

      <section className="surface p-[var(--pad-card)]">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="serif m-0 text-[14.5px] font-semibold">Funnel · leads → casos</h3>
            <p className="text-[11.5px] muted">Últimos {days} días</p>
          </div>
          <select className="input w-auto text-[11px]"
            value={days} onChange={(ev) => setDays(parseInt(ev.target.value))}>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
            <option value="180">180 días</option>
            <option value="365">365 días</option>
          </select>
        </header>
        <FunnelChart stages={labels} />
      </section>
    </div>
  );
}
