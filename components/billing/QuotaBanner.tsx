'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuotaStatus = {
  plan: { code: string; status: string; trial_ends_at: string | null };
  flags: Record<string, boolean>;
};

const DISMISS_KEY = 'lexai_quota_banner_dismissed_at';
const DISMISS_MS = 4 * 60 * 60 * 1000; // 4h

/**
 * Banner sticky en TopBar (o donde se monte) que avisa cuando:
 *   - el trial está por vencer (< 3 días)
 *   - alguna cuota está al 80% o más
 *   - alguna cuota está agotada (over_quota)
 *
 * Permite dismiss por 4h (localStorage).
 */
export function QuotaBanner({ className }: { className?: string }) {
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || '0');
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_MS) {
      setDismissed(true);
    }
    fetch('/api/billing/current-usage', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status || dismissed) return null;

  const flags = status.flags || {};
  const trialEnds = status.plan?.trial_ends_at;
  const daysLeft = trialEnds
    ? Math.ceil((new Date(trialEnds).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 999;
  const trialEnding = status.plan?.status === 'trialing' && daysLeft >= 0 && daysLeft <= 3;
  const trialExpired = flags.trial_expired;
  const anyOver = flags.over_llm || flags.over_voice || flags.over_docs;
  const anyNear = flags.near80_llm || flags.near80_voice || flags.near80_docs;

  if (!trialEnding && !trialExpired && !anyOver && !anyNear) return null;

  const variant: 'warn' | 'bad' = anyOver || trialExpired ? 'bad' : 'warn';
  const message = trialExpired
    ? 'Tu trial expiró. Activa un plan para continuar usando todas las funciones.'
    : anyOver
    ? 'Alcanzaste el límite de tu plan en algunas funciones. Mejora tu plan para continuar.'
    : trialEnding
    ? `Tu trial termina en ${daysLeft === 0 ? 'menos de 24h' : `${daysLeft} día${daysLeft === 1 ? '' : 's'}`}. Activa un plan para no perder acceso.`
    : 'Estás cerca del límite de tu plan en algunas funciones.';

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b px-4 py-2 text-[12px]',
        variant === 'bad' ? 'border-bad/30 bg-bad-soft text-ink' : 'border-warn/30 bg-warn-soft text-ink',
        className,
      )}
      role="status"
    >
      <AlertTriangle size={14} className={variant === 'bad' ? 'text-bad' : 'text-warn'} />
      <span className="flex-1">{message}</span>
      <Link href="/settings/billing" className="btn btn-primary btn-sm">
        Ver planes
      </Link>
      <button
        className="rounded p-1 hover:bg-white/40"
        onClick={dismiss}
        aria-label="Cerrar aviso"
      >
        <X size={13} />
      </button>
    </div>
  );
}
