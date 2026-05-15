'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Loader2, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = { code: string; name: string; monthly_cop: number; annual_cop?: number };
type Module = {
  key: string; name: string; category: string;
  is_core: boolean; sort_order: number;
  by_plan: Record<string, boolean>;
};
type QuotaCell = { limit_value: number | null; soft_cap_pct: number };
type Quota = {
  key: string; name: string; unit: string; reset_period: string;
  by_plan: Record<string, QuotaCell>;
};

const CATEGORY_LABEL: Record<string, string> = {
  core: 'Core', productivity: 'Productividad', ai: 'IA',
  docs: 'Documentos', calc: 'Calculadoras',
  collaboration: 'Colaboración', automation: 'Automatización',
  analytics: 'Analytics', integrations: 'Integraciones',
  client_facing: 'Cliente', billing: 'Facturación',
  marketplace: 'Marketplace', experimental: 'Experimental',
};

const CATEGORY_CLS: Record<string, string> = {
  core: 'chip-ok', productivity: 'chip-accent', ai: 'chip-purple',
  docs: 'chip-neutral', calc: 'chip-neutral',
  collaboration: 'chip-accent', automation: 'chip-warn',
  analytics: 'chip-purple', integrations: 'chip-neutral',
  client_facing: 'chip-accent', billing: 'chip-warn',
  marketplace: 'chip-accent', experimental: 'chip-warn',
};

const PLAN_ACCENT: Record<string, string> = {
  free: 'border-line',
  starter: 'border-accent/40',
  pro: 'border-accent shadow-1',
  firm: 'border-purple/40',
  enterprise: 'border-purple',
};

function formatCOP(v: number | null | undefined): string {
  if (v === null || v === undefined) return '∞';
  if (v === 0) return '0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000).toLocaleString('es-CO')}k`;
  return `$${v.toLocaleString('es-CO')}`;
}

function formatNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '∞';
  return v.toLocaleString('es-CO');
}

export function PlansViewer() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/matrix/modules', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch('/api/admin/matrix/quotas', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
    ]).then(([m, q]) => {
      if (m) { setPlans(m.plans); setModules(m.modules); }
      if (q) setQuotas(q.quotas);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-6 text-[13px] muted">
        <Loader2 size={14} className="animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="surface flex items-center justify-between p-3">
        <div className="text-[12px] muted">
          Fuente de verdad: <code className="mono">plan_modules</code> + <code className="mono">plan_quotas</code>.
          Edita en <Link href="/saas/modules" className="text-accent hover:underline">Módulos</Link>
          {' '}o <Link href="/saas/quotas" className="text-accent hover:underline">Cuotas</Link>.
        </div>
        <div className="flex gap-2">
          <Link href="/saas/modules" className="btn btn-ghost btn-sm">
            <Pencil size={12} /> Editar módulos
          </Link>
          <Link href="/saas/quotas" className="btn btn-ghost btn-sm">
            <Pencil size={12} /> Editar cuotas
          </Link>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5 md:grid-cols-2">
        {plans.map((p) => (
          <PlanCard
            key={p.code}
            plan={p}
            modules={modules}
            quotas={quotas}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan, modules, quotas,
}: {
  plan: Plan;
  modules: Module[];
  quotas: Quota[];
}) {
  const enabledModules = modules.filter((m) => m.by_plan[plan.code]);
  const grouped = enabledModules.reduce((acc, m) => {
    if (m.is_core) return acc; // omit core
    (acc[m.category] = acc[m.category] || []).push(m);
    return acc;
  }, {} as Record<string, Module[]>);
  const nonCoreCount = enabledModules.filter((m) => !m.is_core).length;
  const totalNonCore = modules.filter((m) => !m.is_core).length;

  return (
    <div className={cn('surface flex flex-col p-4 border-2', PLAN_ACCENT[plan.code] || 'border-line')}>
      <header className="mb-3">
        <h3 className="serif text-[18px] font-semibold leading-tight">{plan.name}</h3>
        <div className="mono text-[10px] muted">{plan.code}</div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="serif text-[22px] font-semibold">
            {plan.monthly_cop === 0 ? 'Gratis' : formatCOP(plan.monthly_cop)}
          </span>
          {plan.monthly_cop > 0 && (
            <span className="text-[10.5px] muted">/mes</span>
          )}
        </div>
        {plan.annual_cop && plan.annual_cop > 0 && (
          <div className="text-[10px] muted">
            Anual: {formatCOP(plan.annual_cop / 12)}/mes <span className="text-ok">−17%</span>
          </div>
        )}
        <div className="mt-2 text-[10.5px] muted">
          <strong className="text-ink-2">{nonCoreCount}</strong> de {totalNonCore} módulos
        </div>
      </header>

      {/* CUOTAS */}
      <section className="mb-3 border-y border-line/50 py-2">
        <h4 className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">Cuotas</h4>
        <ul className="grid gap-0.5 text-[11.5px]">
          {quotas.map((q) => {
            const cell = q.by_plan[plan.code];
            const v = cell?.limit_value;
            const blocked = v === 0;
            return (
              <li key={q.key} className="flex justify-between">
                <span className={cn('muted text-[11px]', blocked && 'line-through')}>
                  {q.name}
                </span>
                <span className={cn('mono text-[11px]',
                  v === null ? 'text-ok' : blocked ? 'text-bad' : ''
                )}>
                  {formatNum(v)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* MÓDULOS POR CATEGORÍA */}
      <section className="flex-1 grid gap-2 text-[11px]">
        {Object.entries(grouped)
          .sort(([a], [b]) => (a === 'ai' ? -1 : b === 'ai' ? 1 : 0))
          .map(([cat, items]) => (
          <div key={cat}>
            <span className={cn('chip text-[9px] mb-1 inline-block', CATEGORY_CLS[cat] || 'chip-neutral')}>
              {CATEGORY_LABEL[cat] || cat} · {items.length}
            </span>
            <ul className="grid gap-0">
              {items
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((m) => (
                  <li key={m.key} className="flex items-start gap-1 text-[10.5px] text-ink-2">
                    <Check size={10} className="text-ok shrink-0 mt-0.5" />
                    <span>{m.name}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      {/* DISABLED MODULES (collapsed) */}
      <details className="mt-3 border-t border-line/50 pt-2">
        <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-ink-3 hover:text-ink">
          No incluidos ({totalNonCore - nonCoreCount})
        </summary>
        <ul className="mt-1 grid gap-0">
          {modules
            .filter((m) => !m.is_core && !m.by_plan[plan.code])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((m) => (
              <li key={m.key} className="flex items-start gap-1 text-[10px] muted line-through">
                <X size={10} className="text-ink-3 shrink-0 mt-0.5" />
                <span>{m.name}</span>
              </li>
            ))}
        </ul>
      </details>
    </div>
  );
}
