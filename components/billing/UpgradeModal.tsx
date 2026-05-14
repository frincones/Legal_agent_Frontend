'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UpgradeContext = {
  open: boolean;
  kind?: string;
  used?: number;
  quota?: number;
  plan?: string;
  message?: string;
};

const KIND_LABEL: Record<string, string> = {
  llm_call: 'llamadas IA',
  voice_minute: 'minutos de voz',
  document_upload: 'documentos',
  email_sync: 'cuentas de email',
  judicial_poll: 'consultas judiciales',
};

/**
 * Modal global · se abre cuando un fetch devuelve 402 (quota_exceeded).
 * Se controla vía evento 'lexai:upgrade-required' en window.
 *
 * Para dispararlo desde fetch interceptado:
 *   window.dispatchEvent(new CustomEvent('lexai:upgrade-required', { detail }))
 */
export function UpgradeModal() {
  const [ctx, setCtx] = useState<UpgradeContext>({ open: false });

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<Partial<UpgradeContext>>).detail || {};
      setCtx({ open: true, ...detail });
    };
    window.addEventListener('lexai:upgrade-required', handler);
    return () => window.removeEventListener('lexai:upgrade-required', handler);
  }, []);

  if (!ctx.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="surface relative w-full max-w-md p-6">
        <button
          className="absolute right-3 top-3 rounded p-1 hover:bg-bg-sunken"
          onClick={() => setCtx({ open: false })}
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
        <div className="mb-3 flex items-center gap-2">
          <span className="chip chip-purple">
            <Sparkles size={11} className="mr-1 inline" /> Plan {ctx.plan || 'Free'}
          </span>
        </div>
        <h2 className="serif text-[22px] font-semibold leading-tight">
          Alcanzaste el límite de tu plan
        </h2>
        <p className="mt-2 text-[13px] text-ink-2">
          {ctx.message ||
            `Tu plan permite ${ctx.quota?.toLocaleString('es-CO')} ${
              KIND_LABEL[ctx.kind || ''] || ctx.kind || 'unidades'
            } al mes. Llevas ${ctx.used?.toLocaleString('es-CO')}.`}
        </p>
        <div className="mt-4 grid gap-2 text-[12.5px]">
          <Bullet text="Llamadas IA ilimitadas con Pro" />
          <Bullet text="Hasta 5 usuarios en plan Firma" />
          <Bullet text="Court Watcher + Email ingest" />
          <Bullet text="Cancelable cuando quieras" />
        </div>
        <div className="mt-5 flex gap-2">
          <Link
            href="/settings/billing"
            className="btn btn-primary btn-md flex-1 justify-center"
            onClick={() => setCtx({ open: false })}
          >
            Ver planes y mejorar
          </Link>
          <button
            className="btn btn-ghost btn-md"
            onClick={() => setCtx({ open: false })}
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('inline-block h-1.5 w-1.5 rounded-full bg-accent')} />
      <span>{text}</span>
    </div>
  );
}
