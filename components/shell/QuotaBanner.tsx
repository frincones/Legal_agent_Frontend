'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

type Warning = { kind: string; used: number; limit: number; level: 'warning' | 'exceeded' };

const KIND_LABEL: Record<string, string> = {
  llm_call: 'llamadas LLM',
  voice_minute: 'minutos de voz',
  document_upload: 'documentos',
  email_sync: 'cuentas de correo',
  judicial_poll: 'consultas judiciales',
  canvas_generate: 'generaciones canvas',
};

const STORAGE_KEY = 'lexai.quota_banner.dismissed_at';

export function QuotaBanner() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // No mostrar si fue cerrado en las últimas 4 horas
    try {
      const at = localStorage.getItem(STORAGE_KEY);
      if (at && Date.now() - parseInt(at, 10) < 4 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    } catch {}
    fetch('/api/quotas/current', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.warnings?.length) setWarnings(d.warnings);
      })
      .catch(() => {});
  }, []);

  if (dismissed || warnings.length === 0) return null;
  const exceeded = warnings.filter((w) => w.level === 'exceeded');
  const top = exceeded[0] ?? warnings[0];
  if (!top) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[12.5px]">
      <AlertTriangle size={14} className="text-amber-500" aria-hidden="true" />
      <span>
        <strong className="text-amber-500">
          {top.level === 'exceeded' ? 'Cuota agotada' : 'Cerca del límite'}
        </strong>{' '}
        — {KIND_LABEL[top.kind] || top.kind}: {top.used}/{top.limit}.
        <Link href="/settings/uso" className="ml-2 underline">
          Ver uso
        </Link>
        <span className="mx-1.5">·</span>
        <Link href="/settings/despacho" className="underline">
          Actualizar plan
        </Link>
      </span>
      <button
        className="ml-auto text-ink-2 hover:text-ink"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
          } catch {}
          setDismissed(true);
        }}
        aria-label="Cerrar"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
