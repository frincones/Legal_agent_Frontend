'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronUp, ChevronDown, Rocket, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
  key: string;
  label: string;
  status: 'pending' | 'completed' | 'skipped';
  cta_label?: string;
  cta_href?: string;
  icon?: string;
};

type State = {
  firm_id: string;
  steps: Step[];
  progress_pct: number;
  all_completed: boolean;
  has_demo_data: boolean;
};

const DISMISS_KEY = 'lexai.activation_checklist.dismissed';

export function ActivationChecklist() {
  const [state, setState] = useState<State | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === 'true') {
        setDismissed(true);
        setLoading(false);
        return;
      }
    } catch {}
    fetch('/api/me/onboarding', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.steps) setState(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || dismissed || !state) return null;
  if (state.all_completed) return null;

  function permanentlyDismiss() {
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
    setDismissed(true);
  }

  const pct = state.progress_pct || 0;
  const completedCount = state.steps.filter((s) => s.status === 'completed').length;
  const totalCount = state.steps.length;

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[320px] max-w-[calc(100vw-32px)]">
      <div className="surface shadow-2 overflow-hidden">
        {/* Header */}
        <button
          className="flex w-full items-center gap-3 border-b border-line bg-bg-elev p-3 text-left hover:bg-bg-sunken"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Rocket size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold">Activación</div>
            <div className="text-[10.5px] muted">{completedCount} de {totalCount} completados · {pct}%</div>
          </div>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Progress bar siempre visible */}
        <div className="h-1 bg-bg-sunken">
          <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>

        {/* Steps · expandible */}
        {open && (
          <div className="grid gap-1 p-2">
            {state.steps.map((step) => (
              <Link
                key={step.key}
                href={step.status === 'completed' ? '#' : step.cta_href || '#'}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition',
                  step.status === 'completed'
                    ? 'text-ink-3'
                    : 'hover:bg-bg-sunken text-ink-2',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full border',
                    step.status === 'completed'
                      ? 'bg-ok border-ok text-white'
                      : 'border-line bg-bg',
                  )}
                >
                  {step.status === 'completed' && <Check size={11} />}
                </span>
                <span className={cn('flex-1', step.status === 'completed' && 'line-through')}>
                  {step.label}
                </span>
                {step.status !== 'completed' && step.cta_label && (
                  <span className="text-[10px] text-accent">{step.cta_label}</span>
                )}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-line/40 pt-2">
              <button
                className="text-[10.5px] muted hover:text-ink"
                onClick={permanentlyDismiss}
              >
                No mostrar más
              </button>
              <button
                className="rounded p-1 hover:bg-bg-sunken"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
