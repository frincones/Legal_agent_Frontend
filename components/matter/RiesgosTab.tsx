'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Info, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type CaseRisk = {
  id: string;
  type: string;
  severity: number;
  title: string;
  description: string | null;
  evidence_url: string | null;
  mitigation: string | null;
  detected_by: string | null;
  detected_at: string | null;
  resolved_at: string | null;
};

const RISK_TYPE_LABEL: Record<string, string> = {
  vencimiento: 'Vencimiento próximo',
  jurisprudencia_adversa: 'Jurisprudencia adversa',
  cambio_normativo: 'Cambio normativo',
  parte_poderosa: 'Parte poderosa',
  citas_debilitadas: 'Citas debilitadas',
  documento_faltante: 'Documento faltante',
  inconsistencia: 'Inconsistencia',
  plazo_corto: 'Plazo corto',
  otro: 'Otro',
};

function severityTone(s: number): { label: string; cls: string } {
  if (s >= 8) return { label: 'Alta', cls: 'border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-300' };
  if (s >= 5) return { label: 'Media', cls: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300' };
  return { label: 'Baja', cls: 'border-line bg-bg-elev text-ink-2' };
}

export function RiesgosTab({ matterId }: { matterId: string }) {
  const [items, setItems] = useState<CaseRisk[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/matters/${encodeURIComponent(matterId)}/risks`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = (await res.json()) as { items: CaseRisk[] };
        if (!cancelled) setItems(data.items);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'No se pudieron cargar los riesgos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [matterId]);

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-6 muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        Analizando riesgos…
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <section className="surface p-6">
        <div className="flex items-center gap-3">
          <ShieldAlert size={18} className="text-emerald-500" aria-hidden="true" />
          <div>
            <h3 className="serif text-[15px] font-semibold">Sin riesgos detectados</h3>
            <p className="mt-1 text-[12.5px] muted">
              El detector de riesgos automatizado se activa en Sprint 13 (M32).
              Aquí verás vencimientos, jurisprudencia adversa, cambios normativos que afecten
              tus citas, y parte poderosa según el análisis del agente.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-md border border-line bg-bg-sunken p-3 text-[11.5px] muted">
          <Info size={11} className="mr-1 inline align-text-top" aria-hidden="true" />
          La tabla <code className="mono">case_risks</code> ya está creada y lista. Conforme se
          vayan detectando riesgos por workers o el agente, aparecerán aquí en tiempo real.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <ul className="space-y-2">
        {items.map((r) => {
          const t = severityTone(r.severity);
          return (
            <li key={r.id} className={cn('rounded-lg border p-3', t.cls)}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} aria-hidden="true" />
                <span className="font-semibold">{r.title}</span>
                <span className="chip ml-auto">{t.label}</span>
              </div>
              <div className="mt-1 text-[11.5px] muted">
                {RISK_TYPE_LABEL[r.type] ?? r.type}
                {r.detected_at ? ` · ${formatRelative(r.detected_at)}` : ''}
                {r.detected_by ? ` · por ${r.detected_by}` : ''}
              </div>
              {r.description && (
                <p className="mt-2 text-[12.5px] text-ink-2">{r.description}</p>
              )}
              {r.mitigation && (
                <p className="mt-2 text-[12px]">
                  <span className="font-medium">Mitigación: </span>
                  <span className="text-ink-2">{r.mitigation}</span>
                </p>
              )}
              {r.evidence_url && (
                <a
                  href={r.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11.5px] text-accent hover:underline"
                >
                  Ver evidencia
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
