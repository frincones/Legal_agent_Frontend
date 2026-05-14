'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Plan = {
  code: string; name: string; monthly_cop: number; annual_cop: number;
  q_users: number | null; q_matters: number | null;
  q_documents_mo: number | null; q_llm_calls_mo: number | null;
  q_voice_min_mo: number | null; q_email_accounts: number | null;
  q_judicial_subs: number | null;
  f_court_watcher: boolean; f_email_ingest: boolean; f_voice: boolean;
  f_canvas: boolean; f_calc: boolean; f_briefing: boolean; f_priority_support: boolean;
};

function formatCOP(v: number): string {
  if (v === 0) return 'Gratis';
  return `$${(v / 1000).toLocaleString('es-CO')}k`;
}

export function PlansViewer() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/plans', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setPlans(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {plans.map((p) => (
        <div key={p.code} className="surface p-4">
          <h3 className="serif text-[18px] font-semibold">{p.name}</h3>
          <div className="text-[11px] mono muted">{p.code}</div>
          <div className="serif my-2 text-[20px] font-semibold">{formatCOP(p.monthly_cop)} <span className="text-[11px] muted font-normal">/mes</span></div>
          <div className="text-[10.5px] muted">Anual: {formatCOP(p.annual_cop / 12)} ahorra 17%</div>
          <ul className="mt-3 grid gap-1 text-[11.5px]">
            <Li label="Usuarios" v={p.q_users} />
            <Li label="Casos" v={p.q_matters} />
            <Li label="Docs/mes" v={p.q_documents_mo} />
            <Li label="LLM/mes" v={p.q_llm_calls_mo} />
            <Li label="Voz min" v={p.q_voice_min_mo} />
          </ul>
          <ul className="mt-3 grid gap-0.5 text-[10.5px]">
            <FLi label="Court Watcher" on={p.f_court_watcher} />
            <FLi label="Email ingest" on={p.f_email_ingest} />
            <FLi label="Voice" on={p.f_voice} />
            <FLi label="Canvas" on={p.f_canvas} />
            <FLi label="Calc laborales" on={p.f_calc} />
            <FLi label="Briefing" on={p.f_briefing} />
            <FLi label="Soporte prio" on={p.f_priority_support} />
          </ul>
        </div>
      ))}
    </div>
  );
}

function Li({ label, v }: { label: string; v: number | null }) {
  return (
    <li className="flex justify-between">
      <span className="muted">{label}</span>
      <span className="font-mono">{v === null ? '∞' : v}</span>
    </li>
  );
}

function FLi({ label, on }: { label: string; on: boolean }) {
  return (
    <li className={on ? 'text-ok' : 'muted line-through'}>
      {on ? '✓' : '✗'} {label}
    </li>
  );
}
