import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { LiveCanvasShell } from '@/components/canvas/LiveCanvasShell';
import { fetchMatter } from '@/lib/api/rsc-fetchers';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { SentenciaSeed, ToolSnapshot } from '@/components/canvas/LiveCanvasShell';

export const revalidate = 30;

export default async function CanvasPage({ params }: { params: { matterId: string } }) {
  const matter = await fetchMatter(params.matterId);
  if (!matter) return notFound();

  const supabase = createClient();
  const [sentRes, toolsRes] = await Promise.all([
    supabase
      .from('jurisprudencia')
      .select('id, corte, sala, tipo_sentencia, numero, rubro, ratio_decidendi, vigencia, fuente_url, es_precedente')
      .in('numero', ['T-388/2019', 'SU-449/2020', 'C-200/1995'])
      .limit(3),
    supabase
      .from('agent_tool_calls')
      .select('id, tool_name, status, duration_ms, output')
      .order('started_at', { ascending: false })
      .limit(6),
  ]);

  const sentencias: SentenciaSeed[] = (sentRes.data ?? []).map((s) => {
    const r = s as { id: string; corte: string; sala: string; tipo_sentencia: string; numero: string; rubro: string | null; ratio_decidendi: string | null; vigencia: string | null; fuente_url: string | null; es_precedente: boolean };
    return {
      id: r.id,
      citation_ref: r.numero,
      rubro: r.rubro ?? '',
      corte: r.corte as SentenciaSeed['corte'],
      sala: r.sala,
      tipo_sentencia: (r.tipo_sentencia as SentenciaSeed['tipo_sentencia']) ?? 'T',
      relevancia: r.es_precedente ? 'Muy alta' : 'Alta',
      vigencia: (r.vigencia ?? 'vigente') as SentenciaSeed['vigencia'],
      fragmento: r.ratio_decidendi ?? '',
      url_oficial: r.fuente_url ?? undefined,
    };
  });

  const tools: ToolSnapshot[] = (toolsRes.data ?? []).map((t) => {
    const r = t as { id: string; tool_name: string; status: string; duration_ms: number | null; output: Record<string, unknown> | null };
    return {
      id: r.id,
      name: r.tool_name,
      label: prettyToolName(r.tool_name),
      status: (r.status === 'done' ? 'done' : r.status === 'running' ? 'running' : 'queued') as ToolSnapshot['status'],
      time: r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—',
      result: summarizeToolOutput(r.tool_name, r.output),
    };
  });

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={
            <>
              <Link href="/casos" className="hover:underline">Casos</Link>
              <span className="mx-1.5">/</span>
              <Link href={`/casos/${matter.id}`} className="hover:underline">{matter.titulo}</Link>
              <span className="mx-1.5">/</span>
              <span className="text-accent">Live Canvas</span>
            </>
          }
          title={
            <>
              {matter.titulo} · v3 <span className="chip chip-amber ml-2 align-middle">Borrador</span>
            </>
          }
          subtitle={`${matter.materia} · ${matter.tribunal} · ${tools.length} herramientas registradas`}
          actions={
            <>
              <button className="btn btn-sm">{Ic.pause} Pausar</button>
              <button className="btn">{Ic.download} Export .docx</button>
              <button className="btn btn-primary">{Ic.send} Revisar y radicar</button>
            </>
          }
        />
        <LiveCanvasShell
          sentencias={sentencias.length > 0 ? sentencias : []}
          tools={tools.length > 0 ? tools : []}
        />
      </main>
    </AppShell>
  );
}

function prettyToolName(name: string): string {
  return {
    research_jurisprudence: 'Buscar jurisprudencia (Corte Const. / Suprema)',
    validate_citation: 'Verificar cita vs registry',
    validate_norm_vigencia: 'Verificar vigencia norma',
    calc_liquidacion: 'Calcular liquidación CST',
    open_matter_context: 'Cargar contexto del caso',
    draft_pleading: 'Redactar promoción',
    request_human_approval: 'Solicitar aprobación humana',
  }[name] ?? name;
}

function summarizeToolOutput(name: string, output: Record<string, unknown> | null): string | undefined {
  if (!output) return undefined;
  if (name === 'research_jurisprudence') {
    const hits = (output as { hits?: unknown[] }).hits ?? [];
    return `${hits.length} sentencias`;
  }
  if (name === 'calc_liquidacion') {
    const total = (output as { total_cop?: number }).total_cop;
    return total ? `COP $${total.toLocaleString('es-CO')}` : undefined;
  }
  if (name === 'validate_citation') {
    return (output as { estado?: string }).estado;
  }
  return undefined;
}
