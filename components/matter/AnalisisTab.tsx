'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { formatRelative, formatCOP } from '@/lib/utils';

export type AnalysisRow = {
  id: string;
  matter_document_id: string;
  document_titulo: string | null;
  document_kind: string | null;
  status: string;
  parties_count: number;
  obligations_count: number;
  inconsistencies_count: number;
  confidence_score: number;
  extracted_at: string;
  hechos_clave: string | null;
};

export type AnalysisDetail = {
  id: string;
  parties: Array<{ rol?: string; nombre?: string; tax_id?: string | null; personal_id?: string | null; confianza?: number }>;
  dates: Array<{ tipo?: string; fecha?: string; descripcion?: string; confianza?: number }>;
  obligations: Array<{ deudor?: string; acreedor?: string; descripcion?: string; monto_cop?: number | null; vencimiento?: string | null }>;
  montos: Array<{ concepto?: string; monto?: number; moneda?: string }>;
  inconsistencies: Array<{ descripcion?: string; severidad?: string }>;
  hechos_clave: string | null;
  riesgos_legales: Array<{ riesgo?: string; severidad?: string; fundamento?: string }>;
  vacios_probatorios: Array<{ descripcion?: string; sugerencia?: string }>;
  confidence_score: number;
  model_used: string | null;
  extracted_at: string;
};

export function AnalisisTab({
  matterId,
  documents,
  initialAnalyses,
}: {
  matterId: string;
  documents: Array<{ id: string; titulo: string; kind: string }>;
  initialAnalyses: AnalysisRow[];
}) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnalysisDetail | null>(null);

  async function analyze(documentId: string, regenerate = false) {
    setBusyId(documentId);
    try {
      const res = await fetch(
        `/api/matter-documents/${documentId}/analyze${regenerate ? '?regenerate=1' : ''}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 200) || `HTTP ${res.status}`);
      }
      toast.success('Análisis IA completado');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error en análisis');
    } finally {
      setBusyId(null);
    }
  }

  async function loadDetail(documentId: string) {
    setOpenId(documentId);
    setDetail(null);
    try {
      const res = await fetch(`/api/matter-documents/${documentId}/analysis`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as AnalysisDetail | { status: 'missing' };
      if ('status' in data && data.status === 'missing') {
        setDetail(null);
      } else {
        setDetail(data as AnalysisDetail);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  }

  const analyzedDocs = new Map(analyses.map((a) => [a.matter_document_id, a]));
  const pendingDocs = documents.filter((d) => !analyzedDocs.has(d.id));

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1.4fr]">
      <section className="surface p-[var(--pad-card)]">
        <div className="flex items-center justify-between">
          <h3 className="serif m-0 text-[16px] font-semibold">Documentos del expediente</h3>
          <span className="text-[11.5px] muted">{documents.length}</span>
        </div>
        <div className="mt-3 flex flex-col">
          {documents.length === 0 && (
            <div className="text-[12.5px] muted">
              Aún no hay documentos. Sube un PDF desde la pestaña Documentos.
            </div>
          )}
          {documents.map((d) => {
            const a = analyzedDocs.get(d.id);
            const isOpen = openId === d.id;
            return (
              <div
                key={d.id}
                className="flex flex-col gap-1 border-b border-line py-3 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <span className="grid h-[28px] w-[28px] flex-none place-items-center rounded-md bg-bg-sunken text-ink-2">
                    {Ic.doc}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{d.titulo}</div>
                    <div className="text-[11px] muted">{d.kind}</div>
                  </div>
                  {a ? (
                    <span
                      className={`chip text-[10.5px] ${
                        a.confidence_score >= 0.7
                          ? 'chip-green'
                          : a.confidence_score >= 0.4
                            ? 'chip-amber'
                            : 'chip-red'
                      }`}
                    >
                      {(a.confidence_score * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="chip text-[10.5px]">sin análisis</span>
                  )}
                </div>
                {a && (
                  <div className="ml-9 flex items-center gap-2 text-[11px] muted">
                    <span>{a.parties_count} partes</span>
                    <span>·</span>
                    <span>{a.obligations_count} obligaciones</span>
                    {a.inconsistencies_count > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-warn">{a.inconsistencies_count} alertas</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatRelative(a.extracted_at)}</span>
                  </div>
                )}
                <div className="ml-9 mt-1 flex gap-1.5">
                  {a ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void loadDetail(d.id)}
                        className={`btn btn-sm ${isOpen ? 'btn-primary' : ''}`}
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => void analyze(d.id, true)}
                        disabled={busyId === d.id}
                        className="btn btn-sm btn-ghost"
                      >
                        {busyId === d.id ? 'Re-analizando…' : 'Re-analizar'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void analyze(d.id)}
                      disabled={busyId === d.id}
                      className="btn btn-sm btn-primary"
                    >
                      {busyId === d.id ? 'Analizando…' : <>Analizar con IA {Ic.sparkle}</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {pendingDocs.length > 0 && analyses.length > 0 && (
          <div className="mt-3 rounded-md bg-bg-sunken p-2 text-[11.5px] muted">
            {pendingDocs.length} documento{pendingDocs.length !== 1 ? 's' : ''} sin analizar.
          </div>
        )}
      </section>

      <section className="surface p-[var(--pad-card)]">
        {!openId ? (
          <div className="muted text-[12.5px]">
            Selecciona un documento para ver el análisis IA: partes, fechas, obligaciones, riesgos
            legales y vacíos probatorios.
          </div>
        ) : !detail ? (
          <div className="text-[12.5px] muted">Cargando…</div>
        ) : (
          <DetailView detail={detail} />
        )}
      </section>
    </div>
  );
}

function DetailView({ detail }: { detail: AnalysisDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="chip chip-purple">
          <span className="inline-flex">{Ic.sparkle}</span>Análisis IA
        </span>
        <span className="text-[11.5px] muted">
          {detail.model_used ?? '—'} · {formatRelative(detail.extracted_at)} · confianza{' '}
          {(detail.confidence_score * 100).toFixed(0)}%
        </span>
      </div>

      {detail.hechos_clave && (
        <Card title="Hechos clave">
          <p className="serif m-0 text-[14px] leading-relaxed">{detail.hechos_clave}</p>
        </Card>
      )}

      {detail.parties.length > 0 && (
        <Card title={`Partes (${detail.parties.length})`}>
          <ul className="flex flex-col gap-1">
            {detail.parties.map((p, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[13px]">
                <span className="w-[100px] flex-none text-[11px] uppercase tracking-wider muted">
                  {p.rol ?? 'parte'}
                </span>
                <span className="font-semibold">{p.nombre ?? '—'}</span>
                {(p.tax_id || p.personal_id) && (
                  <span className="text-[11.5px] muted">{p.tax_id ?? p.personal_id}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.dates.length > 0 && (
        <Card title={`Fechas (${detail.dates.length})`}>
          <ul className="flex flex-col gap-1">
            {detail.dates.map((d, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[13px]">
                <span className="w-[110px] flex-none text-[11px] uppercase tracking-wider muted">
                  {d.tipo ?? 'fecha'}
                </span>
                <span className="serif font-semibold">{d.fecha ?? '—'}</span>
                {d.descripcion && (
                  <span className="text-[11.5px] muted">· {d.descripcion}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.obligations.length > 0 && (
        <Card title={`Obligaciones (${detail.obligations.length})`}>
          <ul className="flex flex-col gap-2">
            {detail.obligations.map((o, i) => (
              <li key={i} className="rounded-md bg-bg-sunken p-2 text-[12.5px]">
                <div>
                  <span className="font-semibold">{o.deudor ?? '—'}</span> debe a{' '}
                  <span className="font-semibold">{o.acreedor ?? '—'}</span>
                </div>
                {o.descripcion && <div className="mt-1 text-[12px]">{o.descripcion}</div>}
                <div className="mt-1 flex gap-2 text-[11px] muted">
                  {o.monto_cop && <span>{formatCOP(o.monto_cop)}</span>}
                  {o.vencimiento && <span>· vence {o.vencimiento}</span>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.montos.length > 0 && (
        <Card title="Montos detectados">
          <ul className="flex flex-col gap-1 text-[13px]">
            {detail.montos.map((m, i) => (
              <li key={i} className="flex items-baseline justify-between">
                <span>{m.concepto}</span>
                <span className="serif tabular font-semibold">
                  {(m.moneda ?? 'COP') === 'COP'
                    ? formatCOP(m.monto ?? 0)
                    : `${m.moneda} ${(m.monto ?? 0).toLocaleString()}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.inconsistencies.length > 0 && (
        <Card title="Inconsistencias detectadas" tone="warn">
          <ul className="flex flex-col gap-1.5">
            {detail.inconsistencies.map((it, i) => (
              <li key={i} className="rounded-md bg-bg-sunken p-2 text-[12.5px]">
                <span
                  className={`chip text-[10.5px] mr-2 ${
                    it.severidad === 'alta'
                      ? 'chip-red'
                      : it.severidad === 'media'
                        ? 'chip-amber'
                        : ''
                  }`}
                >
                  {it.severidad ?? '—'}
                </span>
                {it.descripcion}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.riesgos_legales.length > 0 && (
        <Card title="Riesgos legales">
          <ul className="flex flex-col gap-1.5">
            {detail.riesgos_legales.map((r, i) => (
              <li key={i} className="rounded-md bg-bg-sunken p-2 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`chip text-[10.5px] ${
                      r.severidad === 'alta'
                        ? 'chip-red'
                        : r.severidad === 'media'
                          ? 'chip-amber'
                          : ''
                    }`}
                  >
                    {r.severidad ?? '—'}
                  </span>
                  <span className="font-semibold">{r.riesgo}</span>
                </div>
                {r.fundamento && <div className="mt-1 text-[11px] muted">📌 {r.fundamento}</div>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {detail.vacios_probatorios.length > 0 && (
        <Card title="Vacíos probatorios">
          <ul className="flex flex-col gap-1.5">
            {detail.vacios_probatorios.map((v, i) => (
              <li key={i} className="rounded-md bg-bg-sunken p-2 text-[12.5px]">
                <div>{v.descripcion}</div>
                {v.sugerencia && (
                  <div className="mt-1 text-[11px] muted">→ {v.sugerencia}</div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'warn';
}) {
  return (
    <div>
      <div
        className={`mb-2 text-[11.5px] font-semibold uppercase tracking-wider ${
          tone === 'warn' ? 'text-warn' : 'muted'
        }`}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
