/**
 * F4-T08 · Switch de feature flag NEXT_PUBLIC_UX_V2_MATTER.
 *
 * Si el flag está activo → redirect a /v2/casos/[matterId] (MatterArtifact).
 * Si está inactivo → renderiza el legacy con los 16 tabs (sin cambio alguno).
 *
 * CRÍTICO: el código legacy NO se modifica, solo se agrega el bloque condicional
 * al inicio de la función. Los imports permanecen intactos.
 */
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { MatterTabs } from '@/components/matter/MatterTabs';
import { MatterActions } from '@/components/matter/MatterActions';
import { AnalisisTab, type AnalysisRow } from '@/components/matter/AnalisisTab';
import { CitasTab } from '@/components/matter/CitasTab';
import { RiesgosTab } from '@/components/matter/RiesgosTab';
import { RefundamentacionTab } from '@/components/matter/RefundamentacionTab';
import { TimelineRebuildButton } from '@/components/matter/TimelineRebuildButton';
import { InstanceSelector, InstanceBadge } from '@/components/matter/InstanceSelector';
import { DocumentDropzone } from '@/components/documents/DocumentDropzone';
import { HorasGastosTab } from '@/components/billing/HorasGastosTab';
import { MatterLessonsTab } from '@/components/matter/MatterLessonsTab';
import { CommentsThread } from '@/components/collab/CommentsThread';
import { PresenceBar } from '@/components/collab/PresenceBar';
import { MatterPresenceHeartbeat } from '@/components/collab/MatterPresenceHeartbeat';
import { MatterPredictionCard } from '@/components/predictions/MatterPredictionCard';
import { TasksList } from '@/components/tasks/TasksList';
import { JudgePerspectivePanel } from '@/components/judges/JudgePerspectivePanel';
import { EvidenceCheckPanel } from '@/components/evidence/EvidenceCheckPanel';
import { DocumentRowActions } from '@/components/matter/DocumentRowActions';
import { fetchMatter, fetchMatterTimeline } from '@/lib/api/rsc-fetchers';
import { createClient } from '@/lib/supabase/server';
import { cn, formatCOP, formatRelative } from '@/lib/utils';

export const revalidate = 30;

/** F4-T08 · Flag leído en server-side. */
const UX_V2_MATTER = process.env.NEXT_PUBLIC_UX_V2_MATTER === 'true';

export default async function CasoDetallePage({ params }: { params: { matterId: string } }) {
  // ── F4-T08: switch de flag ────────────────────────────────────────────────
  // Si el flag está activo, delega a la página v2 que renderiza MatterArtifact.
  // El código legacy no se ejecuta en ese caso.
  if (UX_V2_MATTER) {
    redirect(`/v2/casos/${params.matterId}`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  const supabase = createClient();
  const matterId = params.matterId;
  const [matter, timelineRes, partesRes, deadlinesRes, docsRes, citationsRes, notesRes, analysesRes] =
    await Promise.all([
      fetchMatter(matterId),
      fetchMatterTimeline(matterId),
      supabase.from('matter_parties').select('rol, nombre, tax_id, client_id, origen').eq('matter_id', matterId),
      supabase.from('matter_deadlines').select('titulo, fecha, tipo, completado').eq('matter_id', matterId).eq('completado', false).order('fecha').limit(10),
      supabase.from('matter_documents').select('id, kind, titulo, status, pages, byte_size, created_at, resumen_ia').eq('matter_id', matterId).order('created_at', { ascending: false }),
      // Citations live on document_citations.matter_document_id, not matter_id directly.
      // Use a join via matter_documents to resolve them per case (Sprint 2 fix).
      supabase
        .from('document_citations')
        .select('citation_ref, rubro_inserted, estado, matter_documents!inner(matter_id)')
        .eq('matter_documents.matter_id', matterId)
        .limit(6),
      supabase.from('matter_notes').select('body, created_at').eq('matter_id', matterId).order('created_at', { ascending: false }),
      supabase
        .from('document_extractions')
        .select('id, matter_document_id, status, parties_jsonb, obligations_jsonb, inconsistencies_jsonb, hechos_clave, confidence_score, extracted_at')
        .eq('matter_id', matterId)
        .eq('status', 'completed')
        .order('extracted_at', { ascending: false }),
    ]);

  if (!matter) return notFound();

  // Sprint 2 · matter.instance puede no estar en el shape devuelto por fetchMatter
  // si el tipado no se ha regenerado tras la migración. Lo leemos defensivamente
  // de la fila del matter (que usa createClient directamente).
  const matterExtraRes = await supabase
    .from('matters')
    .select('instance, proceso_tipo, current_term_due_at')
    .eq('id', matterId)
    .maybeSingle();
  const matterExtra = (matterExtraRes.data ?? {}) as {
    instance?: string | null;
    proceso_tipo?: string | null;
    current_term_due_at?: string | null;
  };

  const clientRes = await supabase
    .from('clients')
    .select('id, nombre, tax_id, personal_id, email, telefono, vip')
    .eq('id', matter.client_id)
    .single();

  const partes = partesRes.data ?? [];
  const deadlines = (deadlinesRes.data ?? []) as Array<{ titulo: string; fecha: string; tipo: string | null }>;
  const documentos = (docsRes.data ?? []) as Array<{ id: string; kind: string; titulo: string; status: string; pages: number | null; byte_size: number | null; created_at: string; resumen_ia: string | null }>;
  const notas = (notesRes.data ?? []) as Array<{ body: string; created_at: string }>;

  // Latest extraction per document for the Análisis IA tab.
  const analysesRaw = (analysesRes.data ?? []) as Array<{
    id: string;
    matter_document_id: string;
    status: string;
    parties_jsonb: unknown[];
    obligations_jsonb: unknown[];
    inconsistencies_jsonb: unknown[];
    hechos_clave: string | null;
    confidence_score: number | null;
    extracted_at: string;
  }>;
  const seenDocs = new Set<string>();
  const docMeta = new Map(documentos.map((d) => [d.id, d]));
  const analyses: AnalysisRow[] = [];
  for (const a of analysesRaw) {
    if (seenDocs.has(a.matter_document_id)) continue;
    seenDocs.add(a.matter_document_id);
    const meta = docMeta.get(a.matter_document_id);
    analyses.push({
      id: a.id,
      matter_document_id: a.matter_document_id,
      document_titulo: meta?.titulo ?? null,
      document_kind: meta?.kind ?? null,
      status: a.status,
      parties_count: Array.isArray(a.parties_jsonb) ? a.parties_jsonb.length : 0,
      obligations_count: Array.isArray(a.obligations_jsonb) ? a.obligations_jsonb.length : 0,
      inconsistencies_count: Array.isArray(a.inconsistencies_jsonb) ? a.inconsistencies_jsonb.length : 0,
      confidence_score: Number(a.confidence_score ?? 0),
      extracted_at: a.extracted_at,
      hechos_clave: a.hechos_clave,
    });
  }
  const cliente = clientRes.data as { nombre: string; tax_id: string | null; personal_id: string | null; email: string | null; telefono: string | null; vip: boolean } | null;

  const resumenPanel = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-4">
        <MatterPredictionCard matterId={matter.id} />
        {documentos[0]?.resumen_ia && (
          <section className="surface p-[var(--pad-card)]">
            <div className="flex items-center gap-2">
              <span className="chip chip-purple">
                <span className="inline-flex">{Ic.sparkle}</span>Resumen IA
              </span>
              <span className="text-[11.5px] muted">
                Generado {formatRelative(documentos[0].created_at)} · gpt-4o · faithfulness 0.94
              </span>
            </div>
            <p className="serif m-[12px_0_0] text-[16px] leading-relaxed -tracking-[0.005em]">
              {documentos[0].resumen_ia}
            </p>
            <div className="mt-4 flex gap-[14px] border-t border-line pt-[14px]">
              {matter.cuantia !== null && (
                <Stat label="Cuantía estimada" big={formatCOP(matter.cuantia)} sub="prestaciones + indemnización" />
              )}
              <Stat label="Etapa" big={matter.etapa_procesal ?? '—'} sub={matter.tribunal ?? ''} />
              {matter.proxima_fecha && (
                <Stat
                  label="Plazo crítico"
                  big={`${Math.max(0, Math.round((new Date(matter.proxima_fecha).getTime() - Date.now()) / (24 * 3600 * 1000)))} días`}
                  sub={matter.proxima_tipo ?? ''}
                />
              )}
            </div>
            <div className="mt-[14px] flex items-start gap-2 rounded-md bg-bg-sunken p-[10px_12px] text-[11.5px] leading-relaxed muted">
              <span className="inline-flex">{Ic.shield}</span>
              <span>
                Resumen generado con IA. No constituye representación legal. Validado por el abogado titulado del despacho.
              </span>
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {(citationsRes.data?.length ?? 0) > 0 && (
          <section
            className="surface p-[var(--pad-card)]"
            style={{
              background: 'linear-gradient(180deg, rgb(var(--purple-soft-rgb)), rgb(var(--bg-elev-rgb)) 60%)',
            }}
          >
            <div className="mb-[10px] flex items-center gap-2">
              <span className="chip chip-purple">
                <span className="inline-flex">{Ic.sparkle}</span>Sentencias citadas
              </span>
              <span className="ml-auto text-[11.5px] muted">{citationsRes.data?.length}</span>
            </div>
            {(citationsRes.data ?? []).map((c, i) => (
              <div key={i} className="mb-2 rounded-md bg-bg-elev p-2.5">
                <div className="flex items-center gap-2">
                  <span className="dot bg-ok" />
                  <span className="mono text-[11px] muted">{(c as { citation_ref: string }).citation_ref}</span>
                  <span className="chip chip-green ml-auto text-[10px]">verificada</span>
                </div>
                <div className="mt-1 text-[11.5px] leading-snug">
                  {(c as { rubro_inserted: string }).rubro_inserted ?? ''}
                </div>
              </div>
            ))}
          </section>
        )}

        {cliente && (
          <section className="surface p-[var(--pad-card)]">
            <h3 className="serif m-0 text-[16px] font-semibold">Cliente</h3>
            <Link href={`/clientes/${matter.client_id}`} className="mt-3 flex items-center gap-3 hover:underline">
              <div className="grid h-[40px] w-[40px] flex-none place-items-center rounded-full bg-accent text-white text-[14px] font-semibold">
                {cliente.nombre.split(' ').slice(0, 2).map((s) => s[0]).join('')}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{cliente.nombre}</div>
                <div className="text-[11.5px] muted">
                  {cliente.tax_id ?? cliente.personal_id ?? ''} · {cliente.email ?? cliente.telefono ?? ''}
                </div>
              </div>
              {cliente.vip && <span className="chip chip-blue ml-auto">VIP</span>}
            </Link>
          </section>
        )}

        <section className="surface p-[var(--pad-card)]">
          <h3 className="serif m-0 text-[16px] font-semibold">Próximos plazos</h3>
          <div className="mt-[10px] flex flex-col">
            {deadlines.slice(0, 5).map((d, i) => {
              const dias = Math.round((new Date(d.fecha).getTime() - Date.now()) / (24 * 3600 * 1000));
              const tone = dias <= 5 ? 'danger' : dias <= 14 ? 'warn' : 'ink';
              return (
                <DeadlineRow
                  key={i}
                  d={new Date(d.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  t={new Date(d.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  h={d.titulo}
                  tone={tone}
                  sub={`${dias >= 0 ? 'en ' : ''}${dias} días`}
                />
              );
            })}
            {deadlines.length === 0 && (
              <div className="text-[12px] muted">Sin plazos pendientes.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const cronologiaPanel = (
    <section className="surface p-[var(--pad-card)]">
      <div className="flex items-center justify-between">
        <h3 className="serif m-0 text-[16px] font-semibold">Cronología completa</h3>
        <div className="flex items-center gap-2">
          <span className="text-[12px] muted">{timelineRes.length} eventos</span>
          <TimelineRebuildButton matterId={matter.id} />
        </div>
      </div>
      <ol className="relative m-[12px_0_0] flex list-none flex-col gap-3 p-0">
        {timelineRes.map((e) => (
          <li
            key={e.id}
            className="grid grid-cols-[140px_1fr] items-baseline gap-2 pl-[22px] text-[13px]"
          >
            <span className="absolute left-0 mt-[2px] h-[11px] w-[11px] rounded-full border-2 border-accent bg-bg-elev" />
            <span className="text-[11.5px] muted">{formatRelative(e.ts)}</span>
            <span>{describeEvent(e.kind, e.payload)}</span>
          </li>
        ))}
        {timelineRes.length === 0 && (
          <li className="text-[12px] muted">Sin eventos registrados todavía.</li>
        )}
      </ol>
    </section>
  );

  const documentosPanel = (
    <section className="surface p-[var(--pad-card)]">
      <div className="flex items-center justify-between">
        <h3 className="serif m-0 text-[16px] font-semibold">Documentos del expediente</h3>
        <span className="text-[12px] muted">{documentos.length}</span>
      </div>
      <div className="mt-3">
        <DocumentDropzone matterId={matter.id} />
      </div>
      <div className="mt-[10px] flex flex-col">
        {documentos.map((d) => (
          <div key={d.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
            <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-md bg-bg-sunken text-ink-3">
              {Ic.doc}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">{d.titulo}</div>
              <div className="text-[11.5px] muted">
                {d.kind.toUpperCase()} · {d.pages ?? 0} págs ·{' '}
                {d.byte_size ? `${Math.round(d.byte_size / 1024)} KB` : '—'} ·{' '}
                {formatRelative(d.created_at)}
              </div>
              {d.resumen_ia && (
                <div className="mt-1 line-clamp-2 text-[12px] text-ink-2">{d.resumen_ia}</div>
              )}
            </div>
            <div className="flex flex-none items-center gap-2">
              <DocumentRowActions
                documentId={d.id}
                documentTitle={d.titulo}
                documents={documentos.map((x) => ({ id: x.id, titulo: x.titulo }))}
              />
              <span className={cn('chip', d.status === 'verificado' ? 'chip-green' : 'chip-amber')}>
                {d.status}
              </span>
            </div>
          </div>
        ))}
        {documentos.length === 0 && (
          <div className="text-[12px] muted">Aún no hay documentos. Sube el primero con el botón &ldquo;Subir&rdquo; arriba.</div>
        )}
      </div>
    </section>
  );

  const partesPanel = (
    <section className="surface p-[var(--pad-card)]">
      <h3 className="serif m-0 text-[16px] font-semibold">Partes del proceso</h3>
      <div className="mt-[10px] flex flex-col gap-[10px]">
        {partes.map((p, i) => (
          <PartyRow key={i} rol={p.rol} nombre={p.nombre} sub={p.tax_id ?? ''} />
        ))}
        {partes.length === 0 && (
          <div className="text-[12px] muted">No hay partes registradas.</div>
        )}
      </div>
    </section>
  );

  const notasPanel = (
    <section className="surface p-[var(--pad-card)]">
      <div className="flex items-center justify-between">
        <h3 className="serif m-0 text-[16px] font-semibold">Notas del despacho</h3>
        <span className="text-[12px] muted">{notas.length}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {notas.map((n, i) => (
          <li key={i} className="rounded-md bg-bg-sunken p-3 text-[12.5px] leading-relaxed">
            <div className="muted text-[11px]">{formatRelative(n.created_at)}</div>
            <div className="mt-1">{n.body}</div>
          </li>
        ))}
        {notas.length === 0 && (
          <li className="text-[12px] muted">Sin notas. Agrega una con voz: &ldquo;Hola LexAI, agrega nota al caso&rdquo;.</li>
        )}
      </ul>
    </section>
  );

  const calendarioPanel = (
    <section className="surface p-[var(--pad-card)]">
      <div className="flex items-center justify-between">
        <h3 className="serif m-0 text-[16px] font-semibold">Calendario del caso</h3>
        <span className="text-[12px] muted">{deadlines.length} eventos</span>
      </div>
      <div className="mt-[10px] flex flex-col">
        {deadlines.map((d, i) => {
          const dias = Math.round((new Date(d.fecha).getTime() - Date.now()) / (24 * 3600 * 1000));
          const tone = dias <= 5 ? 'danger' : dias <= 14 ? 'warn' : 'ink';
          return (
            <DeadlineRow
              key={i}
              d={new Date(d.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
              t={new Date(d.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              h={d.titulo}
              tone={tone}
              sub={`${dias >= 0 ? 'en ' : ''}${dias} días${d.tipo ? ` · ${d.tipo}` : ''}`}
            />
          );
        })}
        {deadlines.length === 0 && (
          <div className="text-[12px] muted">Sin fechas en el calendario.</div>
        )}
      </div>
    </section>
  );

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={
            <>
              <Link href="/casos" className="hover:underline">Casos</Link>
              <span className="mx-1.5">/</span>
              {(matter.materia.charAt(0).toUpperCase() + matter.materia.slice(1))}
              <span className="mx-1.5">/</span>
              {matter.expediente}
            </>
          }
          title={matter.titulo}
          subtitle={
            <span className="inline-flex flex-wrap items-center gap-1">
              <span>{matter.tribunal} · Exp. {matter.expediente}</span>
              <span className="chip chip-amber ml-1">{matter.materia}</span>
              <span className="chip ml-1">{matter.etapa_procesal}</span>
              <InstanceBadge instance={matterExtra.instance} />
              <InstanceSelector
                matterId={matter.id}
                initialInstance={matterExtra.instance}
              />
            </span>
          }
          actions={
            <div className="flex items-center gap-3">
              <PresenceBar matterId={matter.id} />
              <MatterActions
                matterId={matter.id}
                canvasHref={`/casos/${matter.id}/canvas`}
                matterTitulo={matter.titulo ?? undefined}
                clientEmail={clientRes.data?.email ?? null}
              />
            </div>
          }
        />
        <MatterPresenceHeartbeat matterId={matter.id} />

        <MatterTabs
          counts={{
            Documentos: documentos.length,
            Partes: partes.length,
            Notas: notas.length,
            Calendario: deadlines.length,
            'Análisis IA': analyses.length,
            Citas: (citationsRes.data ?? []).length,
          }}
          panels={{
            Resumen: resumenPanel,
            Riesgos: <RiesgosTab matterId={matter.id} />,
            Citas: <CitasTab matterId={matter.id} />,
            Refundamentación: (
              <RefundamentacionTab matterId={matter.id} instance={matterExtra.instance} />
            ),
            'Análisis IA': (
              <AnalisisTab
                matterId={matter.id}
                documents={documentos.map((d) => ({ id: d.id, titulo: d.titulo, kind: d.kind }))}
                initialAnalyses={analyses}
              />
            ),
            'Cronología': cronologiaPanel,
            Documentos: documentosPanel,
            Partes: partesPanel,
            Notas: notasPanel,
            Calendario: calendarioPanel,
            'Horas y Gastos': <HorasGastosTab matterId={matter.id} />,
            'Lecciones': <MatterLessonsTab matterId={matter.id} />,
            'Comentarios': (
              <section className="surface flex flex-col gap-3 p-[var(--pad-card)]">
                <header>
                  <h3 className="serif m-0 text-[16px] font-semibold">Comentarios del caso</h3>
                  <p className="text-[12px] muted">
                    Comentarios anclados al caso. Usa @ para mencionar a alguien del despacho.
                  </p>
                </header>
                <CommentsThread anchor={{ kind: 'matter', matter_id: matter.id }} />
              </section>
            ),
            'Tareas': (
              <section className="surface flex flex-col gap-3 p-[var(--pad-card)]">
                <header>
                  <h3 className="serif m-0 text-[16px] font-semibold">Tareas del caso</h3>
                  <p className="text-[12px] muted">
                    Tareas asignables al despacho · plazo + prioridad + responsable.
                  </p>
                </header>
                <TasksList matterId={matter.id} showMatterColumn={false} />
              </section>
            ),
            'Juez': (
              <section className="surface flex flex-col gap-3 p-[var(--pad-card)]">
                <JudgePerspectivePanel matterId={matter.id} />
              </section>
            ),
            'Evidencia': (
              <EvidenceCheckPanel
                matterId={matter.id}
                documents={documentos.map((d) => ({
                  id: d.id,
                  titulo: d.titulo,
                  kind: d.kind,
                  resumen_ia: d.resumen_ia,
                }))}
              />
            ),
          }}
        />
      </main>
    </AppShell>
  );
}

function describeEvent(kind: string, payload: Record<string, unknown>): string {
  switch (kind) {
    case 'matter_created': return `Caso creado por ${(payload as { by?: string }).by ?? 'el despacho'}`;
    case 'document_uploaded': return `Documento subido: ${(payload as { filename?: string }).filename ?? 'archivo'} (${(payload as { pages?: number }).pages ?? 0} páginas)`;
    case 'agent_calc': return `LexAI calculó ${(payload as { tool?: string }).tool ?? 'cálculo'}: ${formatCOP(Number((payload as { total?: number }).total ?? 0))}`;
    case 'agent_draft': return `LexAI generó borrador (versión ${(payload as { version?: number }).version ?? 1})`;
    case 'voice_session': return `Sesión de voz · ${Math.round(Number((payload as { duration_ms?: number }).duration_ms ?? 0) / 1000)}s · ${(payload as { tool_calls?: number }).tool_calls ?? 0} tools`;
    default: return kind;
  }
}

function Stat({ label, big, sub, tone }: { label: string; big: string; sub: string; tone?: 'ok' }) {
  return (
    <div>
      <div className="text-[11px] font-medium muted">{label}</div>
      <div className={cn('serif tabular mt-[2px] text-[24px] font-semibold -tracking-[0.02em]', tone === 'ok' ? 'text-ok' : 'text-ink')}>
        {big}
      </div>
      <div className="mt-[2px] text-[11.5px] muted">{sub}</div>
    </div>
  );
}

function PartyRow({ rol, nombre, sub }: { rol: string; nombre: string; sub: string }) {
  return (
    <div className="flex items-center gap-[10px]">
      <div className="w-[78px] text-[10.5px] font-semibold uppercase tracking-wider muted">{rol}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{nombre}</div>
        {sub && <div className="text-[11.5px] muted">{sub}</div>}
      </div>
    </div>
  );
}

function DeadlineRow({
  d, t, h, sub, tone,
}: {
  d: string; t: string; h: string; sub: string; tone: 'danger' | 'warn' | 'ink';
}) {
  const colorClass = tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-ink-3';
  return (
    <div className="flex items-center gap-3 border-b border-line py-2 last:border-0">
      <div className="w-[60px] text-center">
        <div className={cn('serif tabular text-[14px] font-semibold', colorClass)}>{d}</div>
        <div className="text-[10.5px] muted">{t}</div>
      </div>
      <div className="min-h-[24px] w-px self-stretch bg-line" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{h}</div>
        <div className="text-[11.5px] muted">{sub}</div>
      </div>
    </div>
  );
}
