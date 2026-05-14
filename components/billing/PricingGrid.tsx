'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Plan = {
  code: string;
  name: string;
  monthly_cop: number;
  annual_cop: number;
  q_users: number | null;
  q_matters: number | null;
  q_documents_mo: number | null;
  q_llm_calls_mo: number | null;
  q_voice_min_mo: number | null;
  q_email_accounts: number | null;
  q_judicial_subs: number | null;
  f_court_watcher: boolean;
  f_email_ingest: boolean;
  f_voice: boolean;
  f_canvas: boolean;
  f_calc: boolean;
  f_briefing: boolean;
  f_priority_support: boolean;
};

function formatCOP(v: number): string {
  if (v === 0) return 'Gratis';
  return `$${Math.round(v / 1000).toLocaleString('es-CO')}k`;
}

function quotaLabel(v: number | null, suffix: string): string {
  if (v === null) return 'Ilimitado';
  return `${v.toLocaleString('es-CO')} ${suffix}`;
}

const FEATURE_ROWS: { key: keyof Plan; label: string }[] = [
  { key: 'q_users', label: 'Usuarios' },
  { key: 'q_matters', label: 'Casos activos' },
  { key: 'q_documents_mo', label: 'Documentos / mes' },
  { key: 'q_llm_calls_mo', label: 'Llamadas IA / mes' },
  { key: 'q_voice_min_mo', label: 'Voz / mes (min)' },
  { key: 'q_email_accounts', label: 'Cuentas de email' },
  { key: 'q_judicial_subs', label: 'Suscripciones judiciales' },
];

const FEATURE_FLAGS: { key: keyof Plan; label: string }[] = [
  { key: 'f_voice', label: 'Asistente de voz' },
  { key: 'f_canvas', label: 'Canvas de redacción' },
  { key: 'f_calc', label: 'Calculadoras laborales' },
  { key: 'f_briefing', label: 'Briefing diario' },
  { key: 'f_court_watcher', label: 'Court Watcher (RPA)' },
  { key: 'f_email_ingest', label: 'Email ingest automático' },
  { key: 'f_priority_support', label: 'Soporte prioritario' },
];

export function PricingGrid({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-8">
      <div className="mb-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-elev p-1">
          <button
            className={cn(
              'rounded-full px-4 py-1.5 text-[12px] font-medium transition',
              !annual ? 'bg-accent text-on-accent' : 'text-ink-3 hover:text-ink',
            )}
            onClick={() => setAnnual(false)}
          >
            Mensual
          </button>
          <button
            className={cn(
              'rounded-full px-4 py-1.5 text-[12px] font-medium transition',
              annual ? 'bg-accent text-on-accent' : 'text-ink-3 hover:text-ink',
            )}
            onClick={() => setAnnual(true)}
          >
            Anual <span className="ml-1 text-[10px] opacity-80">-17%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.length === 0 ? (
          <div className="col-span-3 p-10 text-center text-[13px] muted">
            Cargando planes…
          </div>
        ) : (
          plans.map((plan) => (
            <PlanCard key={plan.code} plan={plan} annual={annual} />
          ))
        )}
      </div>
    </section>
  );
}

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annual_cop / 12 : plan.monthly_cop;
  const isPopular = plan.code === 'pro';
  const isFree = plan.code === 'free';

  return (
    <div
      className={cn(
        'surface relative flex flex-col gap-4 p-6',
        isPopular && 'border-accent shadow-1',
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip chip-accent text-[10px]">
          Más popular
        </span>
      )}
      <header>
        <h3 className="serif text-[20px] font-semibold">{plan.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="serif text-[28px] font-semibold">{formatCOP(price)}</span>
          {price > 0 && <span className="text-[12px] muted">COP / mes</span>}
        </div>
        {annual && price > 0 && (
          <div className="text-[11px] muted">
            Facturado anual: ${plan.annual_cop.toLocaleString('es-CO')} COP
          </div>
        )}
      </header>

      <ul className="grid gap-1.5 text-[12.5px]">
        {FEATURE_ROWS.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-2 border-b border-line/40 py-1">
            <span className="muted">{row.label}</span>
            <span className="font-medium">{quotaLabel(plan[row.key] as number | null, '')}</span>
          </li>
        ))}
        {FEATURE_FLAGS.map((row) => (
          <li key={row.key} className="flex items-center gap-2 py-1">
            {plan[row.key] ? (
              <Check size={14} className="text-ok shrink-0" />
            ) : (
              <X size={14} className="text-ink-3 shrink-0" />
            )}
            <span className={cn('text-[12px]', plan[row.key] ? 'text-ink-2' : 'muted line-through')}>
              {row.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        {isFree ? (
          <Link href="/signup" className="btn btn-md w-full justify-center">
            Empezar gratis
          </Link>
        ) : (
          <Link
            href={`/signup?plan=${plan.code}&period=${annual ? 'annual' : 'monthly'}`}
            className={cn('btn btn-md w-full justify-center', isPopular && 'btn-primary')}
          >
            Comenzar trial
          </Link>
        )}
        <div className="mt-2 text-center text-[10.5px] muted">
          {isFree ? 'Sin tarjeta · sin compromisos' : '14 días gratis · cancelable'}
        </div>
      </div>
    </div>
  );
}
