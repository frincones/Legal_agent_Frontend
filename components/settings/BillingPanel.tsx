'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP } from '@/lib/utils';

type Plan = {
  code: string;
  name: string;
  monthly_cop: number;
  annual_cop: number;
  paddle_price_id: string | null;
  paddle_price_id_annual: string | null;
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

type Subscription = {
  plan: { code: string; name: string; status: string; period_end?: string };
  usage: Record<string, number>;
  quotas: Record<string, number | null>;
  features: Record<string, boolean>;
};

export function BillingPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paddleConfigured, setPaddleConfigured] = useState(false);
  const [paddlePublicToken, setPaddlePublicToken] = useState<string | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/billing/plans', { cache: 'no-store' }),
        fetch('/api/billing/subscription', { cache: 'no-store' }),
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setPlans(d.items || []);
        setPaddleConfigured(!!d.paddle_configured);
        setPaddlePublicToken(d.paddle_public_token || null);
      }
      if (sRes.ok) setSub(await sRes.json());
    } catch (e) {
      toast.error('No pude cargar billing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onUpgrade(planCode: string) {
    setBusyPlan(planCode);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan_code: planCode, billing_period: billingPeriod }),
      });
      const data = await res.json();
      if (!data.configured) {
        toast.message('Paddle no configurado todavía', {
          description: data.message || 'Pide al admin que active las credenciales Paddle.',
        });
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      toast.error('No pude crear el checkout');
    } catch (e) {
      toast.error('Error iniciando checkout');
    } finally {
      setBusyPlan(null);
    }
  }

  async function onCancel() {
    if (!confirm('¿Cancelar la suscripción al final del periodo actual?')) return;
    const res = await fetch('/api/billing/cancel', { method: 'POST' });
    if (res.ok) {
      toast.success('Suscripción cancelada (efectivo al fin del periodo)');
      void refresh();
    } else {
      toast.error('No pude cancelar');
    }
  }

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando billing…
      </div>
    );
  }

  const currentCode = sub?.plan.code || 'free';
  const currentStatus = sub?.plan.status || 'active';

  return (
    <div className="grid gap-4">
      <header className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider muted">Plan actual</div>
          <div className="serif text-[18px] font-semibold">
            {sub?.plan.name || 'Free Trial'}
            <span className="ml-2 text-[11.5px] muted">({currentStatus})</span>
          </div>
          {sub?.plan.period_end && (
            <div className="text-[11.5px] muted">
              Próximo cobro: {new Date(sub.plan.period_end).toLocaleDateString('es-CO')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-line p-0.5">
            {(['monthly', 'annual'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setBillingPeriod(p)}
                className={cn(
                  'rounded px-3 py-1 text-[12px] font-medium',
                  billingPeriod === p ? 'bg-accent text-white' : 'text-ink-2',
                )}
              >
                {p === 'monthly' ? 'Mensual' : 'Anual (-17%)'}
              </button>
            ))}
          </div>
          {currentCode !== 'free' && (
            <button className="btn" onClick={onCancel}>
              Cancelar suscripción
            </button>
          )}
        </div>
      </header>

      {!paddleConfigured && (
        <div className="surface border-amber-500/40 bg-amber-500/5 p-3 text-[12.5px]">
          <strong>Modo demo:</strong> Paddle no está configurado en el servidor. Puedes ver los planes pero
          el checkout no procesa pagos reales todavía.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const price = billingPeriod === 'annual' ? p.annual_cop : p.monthly_cop;
          const isCurrent = currentCode === p.code;
          return (
            <article
              key={p.code}
              className={cn(
                'surface p-4 flex flex-col gap-3',
                isCurrent && 'border-accent ring-1 ring-accent',
              )}
            >
              <div>
                <div className="serif text-[16px] font-semibold">{p.name}</div>
                <div className="text-[22px] font-bold mt-1">
                  {price === 0 ? 'Gratis' : formatCOP(price)}
                  <span className="text-[12px] muted font-normal">
                    {price === 0 ? '' : billingPeriod === 'annual' ? ' /año' : ' /mes'}
                  </span>
                </div>
              </div>
              <ul className="grid gap-1 text-[12.5px]">
                <Quota label="Usuarios" v={p.q_users} />
                <Quota label="Casos" v={p.q_matters} />
                <Quota label="Documentos/mes" v={p.q_documents_mo} />
                <Quota label="Llamadas LLM/mes" v={p.q_llm_calls_mo} />
                <Quota label="Voz (min/mes)" v={p.q_voice_min_mo} />
                <Quota label="Cuentas correo" v={p.q_email_accounts} />
                <Quota label="Suscripciones judiciales" v={p.q_judicial_subs} />
                {p.f_email_ingest && <Feature label="Ingesta correo Gmail/Outlook" />}
                {p.f_priority_support && <Feature label="Soporte prioritario" />}
              </ul>
              <button
                className={cn('btn mt-auto', !isCurrent && 'btn-primary')}
                disabled={isCurrent || busyPlan === p.code}
                onClick={() => onUpgrade(p.code)}
              >
                {busyPlan === p.code ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : isCurrent ? (
                  <Check size={12} aria-hidden="true" />
                ) : (
                  <CreditCard size={12} aria-hidden="true" />
                )}
                {isCurrent ? 'Tu plan' : p.code === 'enterprise' ? 'Hablar con ventas' : 'Contratar'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Quota({ label, v }: { label: string; v: number | null }) {
  return (
    <li className="flex items-center justify-between border-b border-line/40 pb-1">
      <span className="muted">{label}</span>
      <span className="font-semibold">{v === null ? 'Ilimitado' : v}</span>
    </li>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-emerald-500">
      <Sparkles size={11} aria-hidden="true" />
      <span>{label}</span>
    </li>
  );
}
