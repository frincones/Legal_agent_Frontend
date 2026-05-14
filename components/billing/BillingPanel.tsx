'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Check, CreditCard, ExternalLink, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type QuotaStatus = {
  plan: {
    code: string;
    name: string;
    status: string;
    trial_ends_at: string | null;
    monthly_cop: number | null;
    annual_cop: number | null;
    period_start: string;
    period_end: string | null;
  };
  quotas: Record<string, number | null>;
  usage: Record<string, number>;
  features: Record<string, boolean>;
  flags: Record<string, boolean>;
};

type Plan = {
  code: string;
  name: string;
  monthly_cop: number;
  annual_cop: number;
};

const PLAN_BADGE_CLS: Record<string, string> = {
  free: 'chip-neutral',
  pro: 'chip-purple',
  firm: 'chip-purple',
  enterprise: 'chip-purple',
};

const QUOTA_DISPLAY: { kind: string; label: string; quotaKey: string }[] = [
  { kind: 'llm_call', label: 'Llamadas IA', quotaKey: 'llm_calls_mo' },
  { kind: 'voice_minute', label: 'Minutos de voz', quotaKey: 'voice_min_mo' },
  { kind: 'document_upload', label: 'Documentos subidos', quotaKey: 'documents_mo' },
];

export function BillingPanel({ role }: { role: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [paddleConfigured, setPaddleConfigured] = useState(false);

  const canManage = role === 'admin' || role === 'socio_senior';

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/billing/current-usage', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/billing/plans', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([curr, plansResp]) => {
        if (!mounted) return;
        setStatus(curr);
        setPlans(plansResp?.items || []);
        setPaddleConfigured(plansResp?.paddle_configured || false);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function startCheckout(planCode: string, period: 'monthly' | 'annual') {
    setSubmitting(planCode);
    try {
      if (!paddleConfigured) {
        // mock activate
        const r = await fetch('/api/billing/mock-activate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan_code: planCode, billing_period: period }),
        });
        if (r.ok) {
          toast.success(`Plan ${planCode} activado en modo demo`);
          router.refresh();
          // refetch
          const cu = await fetch('/api/billing/current-usage', { cache: 'no-store' });
          if (cu.ok) setStatus(await cu.json());
        } else {
          toast.error('No se pudo activar el plan');
        }
      } else {
        const r = await fetch('/api/billing/checkout-v2', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan_code: planCode, billing_period: period }),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.checkout_url) {
            window.location.href = data.checkout_url;
          } else {
            toast.error('Checkout no devolvió URL');
          }
        } else {
          toast.error('No se pudo iniciar checkout');
        }
      }
    } finally {
      setSubmitting(null);
    }
  }

  async function cancelSubscription() {
    if (!confirm('¿Cancelar tu suscripción al final del periodo facturado?')) return;
    setSubmitting('cancel');
    try {
      const r = await fetch('/api/billing/cancel', { method: 'POST' });
      if (r.ok) {
        toast.success('Suscripción marcada como cancelada');
        const cu = await fetch('/api/billing/current-usage', { cache: 'no-store' });
        if (cu.ok) setStatus(await cu.json());
      } else {
        toast.error('No se pudo cancelar');
      }
    } finally {
      setSubmitting(null);
    }
  }

  async function openPortal() {
    setSubmitting('portal');
    try {
      const r = await fetch('/api/billing/portal', { method: 'POST' });
      if (r.ok) {
        const data = await r.json();
        if (data.url) {
          window.open(data.url, '_blank');
        } else {
          toast.info(data.message || 'Portal no disponible');
        }
      } else {
        toast.error('No se pudo abrir el portal');
      }
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-8 text-[13px] muted">
        <Loader2 className="animate-spin" size={14} /> Cargando plan…
      </div>
    );
  }
  if (!status) {
    return (
      <div className="surface p-8 text-center text-[13px] muted">
        No se pudo cargar la información de tu plan.
      </div>
    );
  }

  const planCode = status.plan?.code || 'free';
  const planName = status.plan?.name || 'Free Trial';
  const subStatus = status.plan?.status || 'trialing';
  const trialEnds = status.plan?.trial_ends_at;
  const flags = status.flags || {};

  return (
    <div className="flex flex-col gap-4">
      {/* Current Plan Card */}
      <section className="surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('chip', PLAN_BADGE_CLS[planCode] || 'chip-neutral')}>
              Plan {planName}
            </span>
            <StatusChip status={subStatus} />
          </div>
          <h3 className="serif mt-2 text-[18px] font-semibold">
            {subStatus === 'trialing' ? 'Estás en periodo de prueba' : `Suscripción ${subStatus}`}
          </h3>
          {trialEnds && subStatus === 'trialing' && (
            <p className="mt-1 text-[12.5px] muted">
              Tu trial termina el{' '}
              <strong>{new Date(trialEnds).toLocaleDateString('es-CO')}</strong>.
            </p>
          )}
          {status.plan.period_end && subStatus === 'active' && (
            <p className="mt-1 text-[12.5px] muted">
              Próxima renovación:{' '}
              <strong>{new Date(status.plan.period_end).toLocaleDateString('es-CO')}</strong>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && planCode !== 'free' && (
            <>
              <button className="btn btn-md" onClick={openPortal} disabled={!!submitting}>
                <CreditCard size={14} /> Portal de pago
              </button>
              <button className="btn btn-ghost btn-md" onClick={cancelSubscription} disabled={!!submitting}>
                {submitting === 'cancel' && <Loader2 className="animate-spin" size={12} />}
                Cancelar suscripción
              </button>
            </>
          )}
          <Link href="/pricing" className="btn btn-ghost btn-md">
            <ExternalLink size={14} /> Comparar planes
          </Link>
        </div>
      </section>

      {/* Quota Usage */}
      <section className="surface p-5">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="serif m-0 text-[16px] font-semibold">Uso del periodo actual</h3>
          <span className="text-[11px] muted">
            Desde {new Date(status.plan.period_start || Date.now()).toLocaleDateString('es-CO')}
          </span>
        </header>
        <div className="grid gap-3">
          {QUOTA_DISPLAY.map((q) => {
            const limit = status.quotas[q.quotaKey];
            const used = status.usage[q.kind] || 0;
            const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
            const isOver = flags[`over_${q.kind === 'llm_call' ? 'llm' : q.kind === 'voice_minute' ? 'voice' : 'docs'}`];
            const isNear = flags[`near80_${q.kind === 'llm_call' ? 'llm' : q.kind === 'voice_minute' ? 'voice' : 'docs'}`];
            return (
              <div key={q.kind}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium">{q.label}</span>
                  <span className={cn('mono', isOver ? 'text-bad' : isNear ? 'text-warn' : 'muted')}>
                    {used.toLocaleString('es-CO')}{' '}
                    {limit != null ? `/ ${limit.toLocaleString('es-CO')}` : '/ ∞'}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-bg-sunken">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isOver ? 'bg-bad' : isNear ? 'bg-warn' : 'bg-accent',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upgrade Options */}
      {canManage && (planCode === 'free' || subStatus === 'trialing') && (
        <section className="surface p-5">
          <header className="mb-3">
            <h3 className="serif m-0 text-[16px] font-semibold">
              <Sparkles size={14} className="mr-1 inline" />
              Escala cuando estés listo
            </h3>
            <p className="text-[12.5px] muted">Activa más capacidad y features. Cancelable cuando quieras.</p>
          </header>
          {!paddleConfigured && (
            <div className="mb-3 rounded-md border-l-2 border-warn bg-warn-soft p-2 text-[11.5px] text-ink-2">
              <strong>Modo demo:</strong> Paddle no está configurado.
              Al "comprar" activamos el plan localmente sin cargo real (para QA).
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-3">
            {plans
              .filter((p) => p.code !== 'free' && p.code !== 'enterprise')
              .map((p) => (
                <div key={p.code} className="rounded-md border border-line bg-bg-elev p-3">
                  <div className="flex items-center justify-between">
                    <strong className="serif text-[15px]">{p.name}</strong>
                    <span className="text-[11px] muted">
                      ${Math.round(p.monthly_cop / 1000).toLocaleString('es-CO')}k / mes
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      className="btn btn-primary btn-sm flex-1 justify-center"
                      onClick={() => startCheckout(p.code, 'monthly')}
                      disabled={!!submitting}
                    >
                      {submitting === p.code && <Loader2 size={11} className="animate-spin" />}
                      Mensual
                    </button>
                    <button
                      className="btn btn-sm flex-1 justify-center"
                      onClick={() => startCheckout(p.code, 'annual')}
                      disabled={!!submitting}
                    >
                      Anual -17%
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Features matrix */}
      <section className="surface p-5">
        <h3 className="serif m-0 mb-3 text-[16px] font-semibold">Features habilitadas en tu plan</h3>
        <ul className="grid gap-1.5 text-[12.5px] md:grid-cols-2">
          {Object.entries(status.features || {}).map(([key, on]) => (
            <li key={key} className="flex items-center gap-2">
              {on ? <Check size={13} className="text-ok" /> : <X size={13} className="text-ink-3" />}
              <span className={cn(on ? 'text-ink-2' : 'muted line-through')}>{featureLabel(key)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Activa', cls: 'chip-ok' },
    trialing: { label: 'Trial', cls: 'chip-purple' },
    past_due: { label: 'Vencida', cls: 'chip-bad' },
    canceled: { label: 'Cancelada', cls: 'chip-neutral' },
    paused: { label: 'Pausada', cls: 'chip-warn' },
    grace: { label: 'Periodo de gracia', cls: 'chip-warn' },
  };
  const v = map[status] || { label: status, cls: 'chip-neutral' };
  return <span className={cn('chip text-[10px]', v.cls)}>{v.label}</span>;
}

function featureLabel(key: string): string {
  const labels: Record<string, string> = {
    court_watcher: 'Court Watcher (RPA judicial)',
    email_ingest: 'Ingesta automática de email',
    voice: 'Asistente de voz',
    canvas: 'Canvas de redacción',
    calc: 'Calculadoras laborales',
    briefing: 'Briefing diario',
    priority_support: 'Soporte prioritario',
  };
  return labels[key] || key;
}
