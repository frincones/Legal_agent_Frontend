'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const KIND_LABEL: Record<string, string> = {
  llm_call: 'Llamadas LLM',
  voice_minute: 'Minutos de voz',
  document_upload: 'Documentos subidos',
  email_sync: 'Sincronizaciones de correo',
  judicial_poll: 'Consultas judiciales',
  canvas_generate: 'Generaciones canvas',
};

const QUOTA_KEY: Record<string, string> = {
  llm_call: 'llm_calls_mo',
  voice_minute: 'voice_min_mo',
  document_upload: 'documents_mo',
  email_sync: 'email_accounts',
  judicial_poll: 'judicial_subs',
  canvas_generate: 'llm_calls_mo',
};

type CurrentResp = {
  plan: { code: string; name: string; status: string; period_end?: string };
  quotas: Record<string, number | null>;
  usage: Record<string, number>;
  features: Record<string, boolean>;
  warnings: Array<{ kind: string; used: number; limit: number; level: 'warning' | 'exceeded' }>;
};

export function UsageDashboard() {
  const [data, setData] = useState<CurrentResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/quotas/current', { cache: 'no-store' });
        if (r.ok) setData(await r.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando uso…
      </div>
    );
  }
  if (!data) {
    return <div className="surface p-4 text-[12.5px] muted">Sin datos de uso.</div>;
  }

  return (
    <div className="grid gap-4">
      <header className="surface p-4">
        <div className="text-[11px] uppercase tracking-wider muted">Periodo actual</div>
        <div className="serif text-[16px] font-semibold">
          Plan {data.plan.name} · <span className="muted">{data.plan.status}</span>
        </div>
      </header>

      {data.warnings.length > 0 && (
        <div className="surface border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-amber-500">
            <AlertTriangle size={14} aria-hidden="true" />
            Cuotas en alerta
          </div>
          <ul className="mt-2 grid gap-1 text-[12.5px]">
            {data.warnings.map((w) => (
              <li key={w.kind}>
                <strong>{KIND_LABEL[w.kind] || w.kind}</strong>: {w.used} / {w.limit} ({w.level === 'exceeded' ? 'excedido' : 'cerca del límite'})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(KIND_LABEL).map(([kind, label]) => {
          const used = data.usage[kind] || 0;
          const qKey = QUOTA_KEY[kind];
          const limit = qKey ? data.quotas[qKey] : null;
          const ratio = limit ? Math.min((used / limit) * 100, 100) : null;
          return (
            <article key={kind} className="surface p-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold">{label}</span>
                <span className="text-[12.5px] muted">
                  {used} {limit !== null && limit !== undefined ? ` / ${limit}` : ''}
                </span>
              </div>
              {ratio !== null && (
                <div className="mt-2 h-2 rounded-full bg-bg-sunken">
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      ratio >= 100 ? 'bg-red-500' : ratio >= 80 ? 'bg-amber-500' : 'bg-accent',
                    )}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              )}
              {ratio === null && (
                <div className="mt-2 text-[11px] muted">Sin límite en tu plan</div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
