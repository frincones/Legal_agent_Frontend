'use client';

/**
 * F4-T01 · MatterArtifact — Contenedor principal del detalle de caso v2.
 *
 * Reemplaza los 16 tabs horizontales con:
 *  - MatterHeader: título + breadcrumb + pills + CTAs
 *  - MatterExecutiveSummary: resumen del agente con cache 5min
 *  - 16 MatterSection (acordeones) priorizadas inteligentemente
 *  - Acciones contextuales al final
 *
 * Detrás del flag NEXT_PUBLIC_UX_V2_MATTER=true.
 * Los componentes legacy NO se tocan.
 */

import {
  FileText,
  Sparkles,
  Clock,
  File,
  Users,
  StickyNote,
  CalendarDays,
  ShieldAlert,
  BookMarked,
  RefreshCcw,
  Timer,
  BookOpen,
  MessageSquare,
  CheckSquare,
  Scale,
  Search,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { Matter, TimelineEvent } from '@/lib/api/rsc-fetchers';
import type { SectionKey, SectionMeta } from '@/lib/v2/matterPrioritization';
import { SECTION_LABELS } from '@/lib/v2/matterPrioritization';
import type { AnalysisRow } from '@/components/matter/AnalisisTab';

import { MatterHeader } from './MatterHeader';
import { MatterExecutiveSummary } from './MatterExecutiveSummary';
import { MatterSection } from './MatterSection';

// Secciones
import { SectionResumen } from './sections/SectionResumen';
import { SectionAnalisisIA } from './sections/SectionAnalisisIA';
import { SectionCronologia } from './sections/SectionCronologia';
import { SectionDocumentos } from './sections/SectionDocumentos';
import { SectionPartes } from './sections/SectionPartes';
import { SectionNotas } from './sections/SectionNotas';
import { SectionCalendario } from './sections/SectionCalendario';
import { SectionRiesgos } from './sections/SectionRiesgos';
import { SectionCitas } from './sections/SectionCitas';
import { SectionRefundamentacion } from './sections/SectionRefundamentacion';
import { SectionHorasYGastos } from './sections/SectionHorasYGastos';
import { SectionLecciones } from './sections/SectionLecciones';
import { SectionComentarios } from './sections/SectionComentarios';
import { SectionTareas } from './sections/SectionTareas';
import { SectionJuez } from './sections/SectionJuez';
import { SectionEvidencia } from './sections/SectionEvidencia';

// ─── Iconos por sección ───────────────────────────────────────────────────────
const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  Resumen: FileText,
  AnalisisIA: Sparkles,
  Cronologia: Clock,
  Documentos: File,
  Partes: Users,
  Notas: StickyNote,
  Calendario: CalendarDays,
  Riesgos: ShieldAlert,
  Citas: BookMarked,
  Refundamentacion: RefreshCcw,
  HorasYGastos: Timer,
  Lecciones: BookOpen,
  Comentarios: MessageSquare,
  Tareas: CheckSquare,
  Juez: Scale,
  Evidencia: Search,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  kind: string;
  titulo: string;
  status: string;
  pages: number | null;
  byte_size: number | null;
  created_at: string;
  resumen_ia: string | null;
}

interface Parte {
  rol: string;
  nombre: string;
  tax_id: string | null;
  client_id?: string | null;
  origen?: string | null;
}

interface Deadline {
  titulo: string;
  fecha: string;
  tipo: string | null;
  completado?: boolean;
}

interface Citation {
  citation_ref: string;
  rubro_inserted: string | null;
  estado: string | null;
}

interface Cliente {
  nombre: string;
  tax_id: string | null;
  personal_id: string | null;
  email: string | null;
  telefono: string | null;
  vip: boolean;
}

export interface MatterArtifactProps {
  matter: Matter;
  sections: SectionMeta[];
  // Datos prelevantados por el Server Component
  timelineEvents: TimelineEvent[];
  documentos: Doc[];
  partes: Parte[];
  deadlines: Deadline[];
  citations: Citation[];
  notas: Array<{ body: string; created_at: string }>;
  analyses: AnalysisRow[];
  cliente: Cliente | null;
  instance?: string | null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MatterArtifact({
  matter,
  sections,
  timelineEvents,
  documentos,
  partes,
  deadlines,
  citations,
  notas,
  analyses,
  cliente,
  instance,
}: MatterArtifactProps) {
  const canvasHref = `/casos/${matter.id}/canvas`;

  // Contadores para los badges de los acordeones
  const badgeCounts: Partial<Record<SectionKey, number>> = {
    Documentos: documentos.length,
    Partes: partes.length,
    Notas: notas.length,
    Calendario: deadlines.length,
    AnalisisIA: analyses.length,
    Citas: citations.length,
    Cronologia: timelineEvents.length,
  };

  return (
    <div
      className="mx-auto w-full max-w-4xl min-w-0 pb-16"
      style={{ fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)' }}
    >
      {/* Header */}
      <MatterHeader matter={matter} canvasHref={canvasHref} />

      {/* Executive Summary del agente */}
      <MatterExecutiveSummary matterId={matter.id} matterTitulo={matter.titulo} />

      {/* 16 secciones acordeón */}
      <div
        className="mx-0 overflow-hidden rounded-none border-t"
        style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}
      >
        {sections.map(({ sectionKey, state }) => {
          const icon = SECTION_ICONS[sectionKey];
          const label = SECTION_LABELS[sectionKey];
          const badge = badgeCounts[sectionKey];
          const content = renderSectionContent(sectionKey, {
            matter,
            timelineEvents,
            documentos,
            partes,
            deadlines,
            citations,
            notas,
            analyses,
            cliente,
            instance,
          });

          return (
            <MatterSection
              key={sectionKey}
              sectionKey={sectionKey}
              title={label}
              icon={icon}
              defaultExpanded={state === 'expanded'}
              badge={badge !== undefined && badge > 0 ? badge : undefined}
            >
              {content}
            </MatterSection>
          );
        })}
      </div>

      {/* Acciones contextuales al fondo */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 px-6">
        <ActionChip href={canvasHref} label="Trabajar en canvas" primary />
        <ActionChip
          onClick={() => window.dispatchEvent(new CustomEvent('lexai:open-voice'))}
          label="Iniciar voz"
        />
        <ActionChip
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('lexai:matter-tab-select', { detail: { tab: 'Cronología' } }),
            )
          }
          label="Ver línea de tiempo"
        />
        <ActionChip
          href={`/predicciones?matter_id=${matter.id}`}
          label="Predicción de resultado"
        />
      </div>
    </div>
  );
}

// ─── Helper: renderizar contenido según sección ───────────────────────────────

function renderSectionContent(
  key: SectionKey,
  data: {
    matter: Matter;
    timelineEvents: TimelineEvent[];
    documentos: Array<Doc>;
    partes: Array<Parte>;
    deadlines: Array<Deadline>;
    citations: Array<Citation>;
    notas: Array<{ body: string; created_at: string }>;
    analyses: AnalysisRow[];
    cliente: Cliente | null;
    instance?: string | null;
  },
): React.ReactNode {
  const { matter } = data;

  switch (key) {
    case 'Resumen':
      return (
        <SectionResumen
          matterId={matter.id}
          matter={{
            cuantia: matter.cuantia,
            etapa_procesal: matter.etapa_procesal,
            tribunal: matter.tribunal,
            proxima_fecha: matter.proxima_fecha,
            proxima_tipo: matter.proxima_tipo,
            client_id: matter.client_id,
          }}
          cliente={data.cliente}
          resumenIA={data.documentos[0]?.resumen_ia ?? null}
          citations={data.citations}
          deadlines={data.deadlines}
        />
      );
    case 'AnalisisIA':
      return (
        <SectionAnalisisIA
          matterId={matter.id}
          documents={data.documentos.map((d) => ({ id: d.id, titulo: d.titulo, kind: d.kind }))}
          initialAnalyses={data.analyses}
        />
      );
    case 'Cronologia':
      return <SectionCronologia matterId={matter.id} timelineEvents={data.timelineEvents} />;
    case 'Documentos':
      return <SectionDocumentos matterId={matter.id} documentos={data.documentos} />;
    case 'Partes':
      return <SectionPartes partes={data.partes} />;
    case 'Notas':
      return <SectionNotas notas={data.notas} />;
    case 'Calendario':
      return <SectionCalendario deadlines={data.deadlines} />;
    case 'Riesgos':
      return <SectionRiesgos matterId={matter.id} />;
    case 'Citas':
      return <SectionCitas matterId={matter.id} />;
    case 'Refundamentacion':
      return <SectionRefundamentacion matterId={matter.id} instance={data.instance} />;
    case 'HorasYGastos':
      return <SectionHorasYGastos matterId={matter.id} />;
    case 'Lecciones':
      return <SectionLecciones matterId={matter.id} />;
    case 'Comentarios':
      return <SectionComentarios matterId={matter.id} />;
    case 'Tareas':
      return <SectionTareas matterId={matter.id} />;
    case 'Juez':
      return <SectionJuez matterId={matter.id} />;
    case 'Evidencia':
      return (
        <SectionEvidencia
          matterId={matter.id}
          documents={data.documentos.map((d) => ({
            id: d.id,
            titulo: d.titulo,
            kind: d.kind,
            resumen_ia: d.resumen_ia,
          }))}
        />
      );
    default:
      return null;
  }
}

// ─── ActionChip ───────────────────────────────────────────────────────────────

function ActionChip({
  label,
  href,
  onClick,
  primary = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const baseStyle: React.CSSProperties = primary
    ? {
        background: 'var(--v2-brand-navy, #0E2A5E)',
        color: '#ffffff',
        border: 'none',
      }
    : {
        background: 'transparent',
        color: 'var(--v2-text-secondary, #4A4944)',
        borderColor: 'var(--v2-bg-muted, #E8E7E1)',
      };

  const className =
    'inline-flex items-center rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-150 cursor-pointer hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2';

  if (href) {
    return (
      <a href={href} className={className} style={baseStyle}>
        {label}
      </a>
    );
  }

  return (
    <button type="button" className={className} style={baseStyle} onClick={onClick}>
      {label}
    </button>
  );
}
