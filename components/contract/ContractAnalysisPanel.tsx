'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertTriangle, CheckCircle2, FileWarning, Loader2, Scale, ShieldCheck, Sparkles, X, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP } from '@/lib/utils';

type Analysis = {
  id: string;
  matter_document_id: string;
  contract_type: string | null;
  parties: Array<{ rol: string; nombre: string; tax_id?: string | null; personal_id?: string | null }>;
  resumen_ejecutivo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  monto_total_cop: number | null;
  moneda: string | null;
  jurisdiccion: string | null;
  ley_aplicable: string | null;
  risk_score: number;
  status: string;
  created_at: string;
};
type Clause = {
  id: string;
  category: string;
  numero: string | null;
  titulo: string | null;
  texto: string;
  importance: 'critica' | 'alta' | 'normal' | 'baja';
  position: number;
};
type Risk = {
  id: string;
  clause_id: string | null;
  kind: string;
  severity: 'bajo' | 'medio' | 'alto' | 'critico';
  title: string;
  description: string;
  suggested_action: string | null;
  suggested_text: string | null;
  citations: string[];
  status: 'open' | 'accepted' | 'dismissed' | 'negotiating';
};

const SEV_META: Record<Risk['severity'], { label: string; cls: string }> = {
  critico: { label: 'Crítico', cls: 'border-red-500/50 text-red-500 bg-red-500/5' },
  alto: { label: 'Alto', cls: 'border-amber-500/50 text-amber-500 bg-amber-500/5' },
  medio: { label: 'Medio', cls: 'border-blue-500/50 text-blue-500 bg-blue-500/5' },
  bajo: { label: 'Bajo', cls: 'border-line text-ink-3' },
};

const CATEGORY_LABEL: Record<string, string> = {
  objeto: 'Objeto', plazo: 'Plazo', precio: 'Precio',
  penalidades: 'Penalidades', indemnidad: 'Indemnidad',
  terminacion: 'Terminación', jurisdiccion: 'Jurisdicción',
  confidencialidad: 'Confidencialidad', no_competencia: 'No competencia',
  fuerza_mayor: 'Fuerza mayor', garantias: 'Garantías', otro: 'Otro',
};

export function ContractAnalysisPanel({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [data, setData] = useState<{ analysis: Analysis; clauses: Clause[]; risks: Risk[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const loadLatest = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/contract-analyzer/documents/${documentId}/latest`, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d.latest === null) setData(null);
        else setData(d);
      }
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (open) void loadLatest();
  }, [open, loadLatest]);

  async function analyze() {
    setAnalyzing(true);
    try {
      const r = await fetch(`/api/contract-analyzer/documents/${documentId}/analyze`, { method: 'POST' });
      if (!r.ok) {
        const txt = await r.text();
        try {
          const j = JSON.parse(txt);
          throw new Error(j.detail || j.message || txt);
        } catch {
          throw new Error(txt.slice(0, 200));
        }
      }
      const d = await r.json();
      toast.success(`Análisis listo · ${d.clauses_count} cláusulas · ${d.risks_count} riesgos`);
      await loadLatest();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setAnalyzing(false);
    }
  }

  async function riskAction(riskId: string, action: 'accept' | 'dismiss') {
    const r = await fetch(`/api/contract-analyzer/risks/${riskId}/${action}`, { method: 'POST' });
    if (r.ok) { toast.success(action === 'accept' ? 'Aceptado' : 'Descartado'); void loadLatest(); }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[820px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="serif text-[18px] font-semibold inline-flex items-center gap-2">
                <Scale size={18} className="text-accent" aria-hidden="true" />
                Análisis de contrato
              </Dialog.Title>
              <p className="text-[12px] muted">Extracción inteligente · cláusulas · riesgos · redlining</p>
            </div>
            <button className="btn" onClick={() => onOpenChange(false)}><X size={14} aria-hidden="true" /></button>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
            </div>
          ) : !data ? (
            <div className="mt-6 grid place-items-center gap-4 p-6 text-center">
              <Sparkles size={32} className="text-accent" aria-hidden="true" />
              <p className="text-[13px] muted max-w-md">
                Este documento aún no se ha analizado. Lanza el análisis para extraer partes,
                cláusulas categorizadas, riesgos legales y sugerencias de redacción.
              </p>
              <button className="btn btn-primary" onClick={analyze} disabled={analyzing}>
                {analyzing ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
                Analizar contrato (~30s)
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {/* Header */}
              <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                <div className="surface p-3">
                  <div className="text-[10.5px] uppercase tracking-wider muted">Tipo</div>
                  <div className="serif text-[16px] font-semibold capitalize">
                    {data.analysis.contract_type?.replace(/_/g, ' ') || '—'}
                  </div>
                  {data.analysis.resumen_ejecutivo && (
                    <p className="mt-2 text-[12.5px] leading-relaxed">{data.analysis.resumen_ejecutivo}</p>
                  )}
                </div>
                <div className={cn(
                  'surface p-3 text-center',
                  data.analysis.risk_score >= 60 && 'border-red-500/40 ring-1 ring-red-500/20',
                  data.analysis.risk_score >= 30 && data.analysis.risk_score < 60 && 'border-amber-500/40',
                )}>
                  <div className="text-[10.5px] uppercase tracking-wider muted">Risk score</div>
                  <div className={cn(
                    'serif text-[28px] font-semibold',
                    data.analysis.risk_score >= 60 ? 'text-red-500' :
                    data.analysis.risk_score >= 30 ? 'text-amber-500' : 'text-emerald-500',
                  )}>
                    {data.analysis.risk_score}
                  </div>
                  <div className="text-[10.5px] muted">/ 100</div>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 text-[12px]">
                <Cell label="Inicio" v={data.analysis.fecha_inicio || '—'} />
                <Cell label="Fin" v={data.analysis.fecha_fin || '—'} />
                <Cell label="Monto" v={data.analysis.monto_total_cop ? formatCOP(data.analysis.monto_total_cop) : '—'} />
                <Cell label="Jurisdicción" v={data.analysis.jurisdiccion || '—'} />
              </div>

              {/* Parties */}
              {data.analysis.parties && data.analysis.parties.length > 0 && (
                <section>
                  <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">Partes</h3>
                  <ul className="grid gap-1.5">
                    {data.analysis.parties.map((p, i) => (
                      <li key={i} className="rounded-md border border-line bg-bg-elev p-2 text-[12.5px]">
                        <span className="font-semibold">{p.nombre}</span>
                        <span className="ml-2 text-[11px] muted">— {p.rol}</span>
                        {(p.tax_id || p.personal_id) && (
                          <span className="ml-2 mono text-[10.5px] muted">{p.tax_id || p.personal_id}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Risks */}
              <section>
                <h3 className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wider muted">
                  <ShieldCheck size={11} aria-hidden="true" /> Riesgos detectados ({data.risks.length})
                </h3>
                {data.risks.length === 0 ? (
                  <div className="surface p-3 text-[12.5px] text-emerald-500 inline-flex items-center gap-2">
                    <CheckCircle2 size={14} aria-hidden="true" /> Sin riesgos críticos.
                  </div>
                ) : (
                  <ul className="grid gap-2">
                    {data.risks.map((r) => (
                      <li key={r.id} className={cn('rounded-md border p-3', SEV_META[r.severity].cls)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-semibold">
                                <AlertTriangle size={10} aria-hidden="true" />
                                {SEV_META[r.severity].label}
                              </span>
                              <strong className="text-[13px]">{r.title}</strong>
                              {r.status !== 'open' && (
                                <span className="ml-1 text-[10.5px] muted">[{r.status}]</span>
                              )}
                            </div>
                            <p className="mt-1 text-[12px]">{r.description}</p>
                            {r.suggested_action && (
                              <p className="mt-1 text-[12px]">→ <strong>{r.suggested_action}</strong></p>
                            )}
                            {r.suggested_text && (
                              <pre className="mt-2 rounded border border-line bg-bg-elev p-2 text-[11px] whitespace-pre-wrap font-mono">{r.suggested_text}</pre>
                            )}
                            {r.citations && r.citations.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {r.citations.map((c, i) => (
                                  <span key={i} className="rounded border border-line px-1.5 py-0.5 text-[10px] mono">{c}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {r.status === 'open' && (
                            <div className="flex flex-none gap-1">
                              <button className="btn" onClick={() => riskAction(r.id, 'accept')} title="Aceptar (atender)">
                                <CheckCircle2 size={11} className="text-emerald-500" aria-hidden="true" />
                              </button>
                              <button className="btn" onClick={() => riskAction(r.id, 'dismiss')} title="Descartar">
                                <XCircle size={11} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Clauses */}
              <section>
                <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">
                  Cláusulas ({data.clauses.length})
                </h3>
                <ul className="grid gap-1.5">
                  {data.clauses.map((c) => (
                    <li key={c.id} className={cn(
                      'rounded-md border bg-bg-elev p-2.5 text-[12px]',
                      c.importance === 'critica' && 'border-red-500/40',
                      c.importance === 'alta' && 'border-amber-500/40',
                      c.importance === 'normal' && 'border-line',
                      c.importance === 'baja' && 'border-line opacity-70',
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold">
                          {CATEGORY_LABEL[c.category] || c.category}
                        </span>
                        {c.numero && <span className="mono text-[11px] muted">{c.numero}</span>}
                        {c.titulo && <strong className="text-[12.5px] truncate">{c.titulo}</strong>}
                      </div>
                      <p className="mt-1 line-clamp-3 muted">{c.texto}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <footer className="flex justify-between text-[11px] muted">
                <span>Generado por {data.analysis.status} · {data.analysis.created_at?.slice(0, 10)}</span>
                <button className="btn" onClick={analyze} disabled={analyzing}>
                  {analyzing ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Sparkles size={11} aria-hidden="true" />}
                  Re-analizar
                </button>
              </footer>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cell({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-bg-elev p-2">
      <div className="text-[10.5px] uppercase tracking-wider muted">{label}</div>
      <div className="mt-0.5 truncate text-[12.5px]">{v}</div>
    </div>
  );
}
