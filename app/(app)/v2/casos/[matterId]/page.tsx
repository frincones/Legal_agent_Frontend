/**
 * F4-T07 · app/(app)/v2/casos/[matterId]/page.tsx
 *
 * Server Component que:
 * 1. Carga todos los datos del matter en paralelo (misma estrategia que el legacy).
 * 2. Calcula la priorización de secciones con prioritizeMatterSections().
 * 3. Renderiza MatterArtifact dentro del AppShell.
 *
 * Accesible vía NEXT_PUBLIC_UX_V2_MATTER=true (switch en el page.tsx legacy).
 */

import { notFound } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { MatterArtifact } from '@/components/v2/matter/MatterArtifact';
import { MatterComposerStrip } from '@/components/v2/matter/MatterComposerStrip';
import { MatterPresenceHeartbeat } from '@/components/collab/MatterPresenceHeartbeat';
import { fetchMatter, fetchMatterTimeline } from '@/lib/api/rsc-fetchers';
import { prioritizeMatterSections } from '@/lib/v2/matterPrioritization';
import { createClient } from '@/lib/supabase/server';
import type { AnalysisRow } from '@/components/matter/AnalisisTab';

export const revalidate = 30;

export default async function CasoDetalleV2Page({
  params,
}: {
  params: { matterId: string };
}) {
  const matterId = params.matterId;
  const supabase = createClient();

  // Carga en paralelo — mismos datos que el page.tsx legacy
  const [
    matter,
    timelineRes,
    partesRes,
    deadlinesRes,
    docsRes,
    citationsRes,
    notesRes,
    analysesRes,
    risksRes,
  ] = await Promise.all([
    fetchMatter(matterId),
    fetchMatterTimeline(matterId),
    supabase
      .from('matter_parties')
      .select('rol, nombre, tax_id, client_id, origen')
      .eq('matter_id', matterId),
    supabase
      .from('matter_deadlines')
      .select('titulo, fecha, tipo, completado')
      .eq('matter_id', matterId)
      .eq('completado', false)
      .order('fecha')
      .limit(20),
    supabase
      .from('matter_documents')
      .select('id, kind, titulo, status, pages, byte_size, created_at, resumen_ia')
      .eq('matter_id', matterId)
      .order('created_at', { ascending: false }),
    supabase
      .from('document_citations')
      .select('citation_ref, rubro_inserted, estado, matter_documents!inner(matter_id)')
      .eq('matter_documents.matter_id', matterId)
      .limit(10),
    supabase
      .from('matter_notes')
      .select('body, created_at')
      .eq('matter_id', matterId)
      .order('created_at', { ascending: false }),
    supabase
      .from('document_extractions')
      .select(
        'id, matter_document_id, status, parties_jsonb, obligations_jsonb, inconsistencies_jsonb, hechos_clave, confidence_score, extracted_at',
      )
      .eq('matter_id', matterId)
      .eq('status', 'completed')
      .order('extracted_at', { ascending: false }),
    // Riesgos para la priorización inteligente (tabla case_risks · Sprint 2)
    supabase
      .from('case_risks')
      .select('id, severity, title, resolved_at')
      .eq('matter_id', matterId)
      .is('resolved_at', null)
      .limit(10),
  ]);

  if (!matter) return notFound();

  // Campos extra del matter
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

  // Cliente principal
  const clientRes = await supabase
    .from('clients')
    .select('id, nombre, tax_id, personal_id, email, telefono, vip')
    .eq('id', matter.client_id)
    .single();

  // Normalizar datos
  const partes = (partesRes.data ?? []) as Array<{
    rol: string;
    nombre: string;
    tax_id: string | null;
    client_id?: string | null;
    origen?: string | null;
  }>;

  const deadlines = (deadlinesRes.data ?? []) as Array<{
    titulo: string;
    fecha: string;
    tipo: string | null;
    completado?: boolean;
  }>;

  const documentos = (docsRes.data ?? []) as Array<{
    id: string;
    kind: string;
    titulo: string;
    status: string;
    pages: number | null;
    byte_size: number | null;
    created_at: string;
    resumen_ia: string | null;
  }>;

  const citations = ((citationsRes.data ?? []) as Array<{
    citation_ref: string;
    rubro_inserted: string | null;
    estado: string | null;
  }>);

  const notas = (notesRes.data ?? []) as Array<{ body: string; created_at: string }>;

  const risks = (risksRes.data ?? []) as Array<{
    severity?: number;
    title?: string;
    resolved_at?: string | null;
  }>;

  // Construir AnalysisRow[]
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

  const cliente = clientRes.data as {
    nombre: string;
    tax_id: string | null;
    personal_id: string | null;
    email: string | null;
    telefono: string | null;
    vip: boolean;
  } | null;

  // Priorización inteligente de secciones
  const sections = prioritizeMatterSections(matter, deadlines, risks);

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden h-full">
        <MatterPresenceHeartbeat matterId={matter.id} />
        {/* Zona scroll: todo el artifact */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MatterArtifact
            matter={matter}
            sections={sections}
            timelineEvents={timelineRes}
            documentos={documentos}
            partes={partes}
            deadlines={deadlines}
            citations={citations}
            notas={notas}
            analyses={analyses}
            cliente={cliente}
            instance={matterExtra.instance}
          />
        </div>
        {/* Compositor sticky al fondo — solo cuando NEXT_PUBLIC_UX_V2_COMPOSER=true */}
        <MatterComposerStrip matterId={matter.id} />
      </main>
    </AppShell>
  );
}
