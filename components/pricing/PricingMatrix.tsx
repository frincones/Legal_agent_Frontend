'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = { code: string; name: string; monthly_cop: number; annual_cop: number };
type Module = {
  key: string; name: string; description: string | null; category: string;
  is_core: boolean; sort_order: number;
  by_plan: Record<string, boolean>;
};
type QuotaCell = { limit_value: number | null; soft_cap_pct: number };
type Quota = {
  key: string; name: string; unit: string; reset_period: string; sort_order: number;
  by_plan: Record<string, QuotaCell>;
};

const PLAN_ACCENT: Record<string, { border: string; cta: string; chip: string | null }> = {
  free: { border: 'border-line', cta: 'btn', chip: null },
  starter: { border: 'border-accent/30', cta: 'btn', chip: null },
  pro: { border: 'border-accent shadow-1', cta: 'btn btn-primary', chip: 'Más popular' },
  firm: { border: 'border-purple/40', cta: 'btn', chip: 'Para equipos' },
  enterprise: { border: 'border-purple', cta: 'btn', chip: null },
};

const CATEGORY_LABEL: Record<string, string> = {
  productivity: 'Productividad', ai: 'IA jurídica', docs: 'Documentos',
  calc: 'Calculadoras', collaboration: 'Colaboración', automation: 'Automatización',
  analytics: 'Analytics', integrations: 'Integraciones',
  client_facing: 'Cliente', billing: 'Facturación', marketplace: 'Marketplace',
};

const PRACTICAL_LABEL: Record<string, string> = {
  llm_calls: 'Llamadas IA/mes',
  voice_minutes: 'Voz (minutos/mes)',
  documents_uploaded: 'Documentos/mes',
  matters_active: 'Casos activos',
  users: 'Usuarios',
  email_accounts: 'Cuentas de email',
  judicial_subscriptions: 'Court Watcher subs.',
  wizards_generated: 'Trámites generados/mes',
};

const PRACTICAL_ORDER = ['users', 'matters_active', 'llm_calls', 'voice_minutes', 'documents_uploaded', 'email_accounts', 'judicial_subscriptions', 'wizards_generated'];

const KILLER_MODULES = [
  'canvas', 'citations_research', 'citations_validate',
  'judicial_polling', 'judges', 'judge_simulator', 'evidence_checker',
  'predictions', 'contract_analyzer', 'doc_qa', 'voice_agent',
  'email_ingest', 'whatsapp_integration', 'signatures',
  'knowledge_base', 'marketplace', 'analytics_executive', 'api_public',
];

const MODULE_DESC: Record<string, string> = {
  canvas: 'Editor de escritos con IA + citas verificadas',
  citations_research: 'Investigación jurisprudencial en portales oficiales',
  citations_validate: 'Validación de derogaciones en vivo',
  judicial_polling: 'Court Watcher · monitoreo automático de expedientes',
  judges: 'Base de jueces colombianos',
  judge_simulator: 'Simulador IA de recepción del juez',
  evidence_checker: 'Validación de evidencia + autenticidad',
  predictions: 'Forecasting de resultados',
  contract_analyzer: 'Análisis de cláusulas + riesgos',
  doc_qa: 'Chat con tus documentos',
  voice_agent: 'Asistente de voz "habla con tus casos"',
  email_ingest: 'Sincronización con Gmail/Outlook',
  whatsapp_integration: 'WhatsApp Business para clientes',
  signatures: 'Firmas electrónicas (DocuSign/Certicámara)',
  knowledge_base: 'Memoria del despacho (KB)',
  marketplace: 'Templates compartidos',
  analytics_executive: 'Dashboard ejecutivo (revenue, pipeline)',
  api_public: 'API REST + webhooks',
};

function formatCOP(v: number): string {
  if (v === 0) return 'Gratis';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(v / 1000).toLocaleString('es-CO')}k`;
}

function formatQuota(v: number | null | undefined): string {
  if (v === null || v === undefined) return '∞';
  if (v === 0) return '—';
  return v.toLocaleString('es-CO');
}

export function PricingMatrix({
  plans, modules, quotas,
}: {
  plans: Plan[];
  modules: Module[];
  quotas: Quota[];
}) {
  const [annual, setAnnual] = useState(true);

  const sortedPlans = [...plans].sort((a, b) => a.monthly_cop - b.monthly_cop);
  const quotasMap = new Map(quotas.map((q) => [q.key, q]));
  const modulesMap = new Map(modules.map((m) => [m.key, m]));

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12">
      {/* Annual/Monthly toggle */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-elev p-1">
          <button
            className={cn('rounded-full px-4 py-1.5 text-[12px] font-medium transition',
              !annual ? 'bg-accent text-on-accent' : 'text-ink-3 hover:text-ink')}
            onClick={() => setAnnual(false)}
          >Mensual</button>
          <button
            className={cn('rounded-full px-4 py-1.5 text-[12px] font-medium transition',
              annual ? 'bg-accent text-on-accent' : 'text-ink-3 hover:text-ink')}
            onClick={() => setAnnual(true)}
          >
            Anual <span className="ml-1 text-[10px] opacity-80">−17%</span>
          </button>
        </div>
      </div>

      {/* 5 plan cards */}
      <div className="grid gap-3 md:grid-cols-5">
        {sortedPlans.map((plan) => {
          const accent = PLAN_ACCENT[plan.code] || PLAN_ACCENT.free!;
          const price = annual ? plan.annual_cop / 12 : plan.monthly_cop;
          const isFree = plan.code === 'free';
          const isEnterprise = plan.code === 'enterprise';
          const ctaHref = isFree ? '/signup' : isEnterprise ? 'mailto:sales@lexai.co' : `/signup?plan=${plan.code}&period=${annual ? 'annual' : 'monthly'}`;
          const ctaLabel = isFree ? 'Empezar gratis' : isEnterprise ? 'Contactar ventas' : 'Comenzar trial';

          return (
            <div key={plan.code} className={cn('surface relative flex flex-col gap-4 p-5 border-2', accent.border)}>
              {accent.chip && (
                <span className={cn('absolute -top-3 left-1/2 -translate-x-1/2 chip text-[10px]',
                  plan.code === 'pro' ? 'chip-accent' : 'chip-purple')}>
                  {accent.chip}
                </span>
              )}

              <header>
                <h3 className="serif text-[20px] font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="serif text-[26px] font-semibold">
                    {isEnterprise ? 'Custom' : formatCOP(price)}
                  </span>
                  {price > 0 && !isEnterprise && <span className="text-[11px] muted">/mes</span>}
                </div>
                {annual && price > 0 && !isEnterprise && (
                  <div className="text-[10.5px] muted">Anual: ${plan.annual_cop.toLocaleString('es-CO')} COP/año</div>
                )}
              </header>

              {/* Cuotas clave */}
              <ul className="grid gap-1 border-y border-line/40 py-3 text-[11.5px]">
                {PRACTICAL_ORDER.slice(0, 5).map((key) => {
                  const q = quotasMap.get(key);
                  if (!q) return null;
                  const cell = q.by_plan[plan.code];
                  const v = cell?.limit_value;
                  const blocked = v === 0;
                  return (
                    <li key={key} className={cn('flex items-center justify-between',
                      blocked && 'opacity-40')}>
                      <span className="muted">{PRACTICAL_LABEL[key]}</span>
                      <span className={cn('font-mono', v === null && 'text-ok')}>
                        {formatQuota(v)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* CTA */}
              <Link href={ctaHref} className={cn('justify-center', accent.cta, 'btn-md')}>
                {ctaLabel}
              </Link>
              <div className="text-center text-[10.5px] muted">
                {isFree ? 'Sin tarjeta · sin compromisos' : isEnterprise ? 'Planes a la medida' : '14 días gratis · cancela cuando quieras'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Killer features comparison */}
      <div className="mt-12">
        <h2 className="serif mb-4 text-center text-[22px] font-semibold">¿Qué incluye cada plan?</h2>
        <p className="mb-6 text-center text-[12px] muted">
          Comparación de features clave · pasa el mouse para ver descripción
        </p>
        <div className="surface overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-bg-sunken sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium min-w-[200px]">Feature</th>
                {sortedPlans.map((p) => (
                  <th key={p.code} className="px-3 py-3 text-center font-medium min-w-[80px]">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KILLER_MODULES.map((moduleKey) => {
                const m = modulesMap.get(moduleKey);
                if (!m) return null;
                return (
                  <tr key={moduleKey} className="border-t border-line/30 hover:bg-bg-sunken/30">
                    <td className="px-4 py-2">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[10.5px] muted">{MODULE_DESC[moduleKey] || m.description}</div>
                    </td>
                    {sortedPlans.map((p) => (
                      <td key={p.code} className="px-3 py-2 text-center">
                        {m.by_plan[p.code] ? (
                          <Check size={14} className="inline text-ok" />
                        ) : (
                          <X size={14} className="inline text-ink-3 opacity-40" />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
