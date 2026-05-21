/**
 * F4-T02 · LexAI UX v2 — Priorización inteligente de secciones del MatterArtifact.
 *
 * Decide qué secciones del caso se muestran expandidas por defecto según
 * el contexto del matter (plazos inminentes, riesgos críticos, edad del caso, etc.).
 * Las secciones expandidas aparecen primero; las colapsadas van al final.
 */

import type { Matter } from '@/lib/api/rsc-fetchers';

export type SectionKey =
  | 'Resumen'
  | 'AnalisisIA'
  | 'Cronologia'
  | 'Documentos'
  | 'Partes'
  | 'Notas'
  | 'Calendario'
  | 'Riesgos'
  | 'Citas'
  | 'Refundamentacion'
  | 'HorasYGastos'
  | 'Lecciones'
  | 'Comentarios'
  | 'Tareas'
  | 'Juez'
  | 'Evidencia';

export type SectionMeta = {
  sectionKey: SectionKey;
  state: 'expanded' | 'collapsed';
};

type Deadline = {
  fecha: string;
  completado?: boolean;
};

type Risk = {
  severity?: number;
  title?: string;
  resolved_at?: string | null;
};

const ALL_SECTIONS: SectionKey[] = [
  'Resumen',
  'AnalisisIA',
  'Cronologia',
  'Documentos',
  'Partes',
  'Notas',
  'Calendario',
  'Riesgos',
  'Citas',
  'Refundamentacion',
  'HorasYGastos',
  'Lecciones',
  'Comentarios',
  'Tareas',
  'Juez',
  'Evidencia',
];

/**
 * Determina qué secciones deben estar expandidas por defecto.
 *
 * Retorna el array completo de 16 secciones ordenado: expandidas primero,
 * luego colapsadas. Dentro de cada grupo, el orden es el definido en
 * ALL_SECTIONS (refleja el orden de los tabs legacy).
 */
export function prioritizeMatterSections(
  matter: Matter | null,
  deadlines: Deadline[],
  risks: Risk[],
): SectionMeta[] {
  const expanded = new Set<SectionKey>();

  // Resumen y Análisis IA siempre expandidos
  expanded.add('Resumen');
  expanded.add('AnalisisIA');

  if (matter) {
    const now = Date.now();
    const createdAt = matter.created_at ? new Date(matter.created_at).getTime() : now;
    const matterAgeMs = now - createdAt;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // Matter nuevo (menos de 7 días) → Resumen + Partes expandidos
    if (matterAgeMs < SEVEN_DAYS_MS) {
      expanded.add('Partes');
    }

    // Audiencia en próximos 7 días → Cronología + Tareas expandidos
    const hasUrgentDeadline = deadlines.some((d) => {
      if (d.completado) return false;
      const diff = new Date(d.fecha).getTime() - now;
      return diff > 0 && diff < SEVEN_DAYS_MS;
    });
    if (hasUrgentDeadline) {
      expanded.add('Cronologia');
      expanded.add('Tareas');
      expanded.add('Calendario');
    }

    // Riesgo crítico → Riesgos expandido
    const hasCriticalRisk = risks.some(
      (r) => !r.resolved_at && (r.severity === undefined ? false : r.severity >= 4),
    );
    const hasPrescripcionRisk = risks.some(
      (r) =>
        !r.resolved_at &&
        r.title &&
        (r.title.toLowerCase().includes('prescripci') ||
          r.title.toLowerCase().includes('caducidad')),
    );
    if (hasCriticalRisk || hasPrescripcionRisk) {
      expanded.add('Riesgos');
    }

    // Documentos pendientes de análisis → Documentos expandido
    if ((matter.pendientes ?? 0) > 0) {
      expanded.add('Documentos');
    }

    // Instancia apelación/casación → Refundamentación expandida
    const etapa = (matter.etapa_procesal ?? '').toLowerCase();
    if (etapa.includes('apelaci') || etapa.includes('casaci') || etapa.includes('segunda instancia')) {
      expanded.add('Refundamentacion');
    }
  }

  // Construir array final: expandidas primero (en orden), colapsadas después
  const expandedSections: SectionMeta[] = ALL_SECTIONS.filter((k) => expanded.has(k)).map((k) => ({
    sectionKey: k,
    state: 'expanded',
  }));

  const collapsedSections: SectionMeta[] = ALL_SECTIONS.filter((k) => !expanded.has(k)).map((k) => ({
    sectionKey: k,
    state: 'collapsed',
  }));

  return [...expandedSections, ...collapsedSections];
}

/**
 * Mapa de claves internas → label visible en la UI.
 */
export const SECTION_LABELS: Record<SectionKey, string> = {
  Resumen: 'Resumen',
  AnalisisIA: 'Análisis IA',
  Cronologia: 'Cronología',
  Documentos: 'Documentos',
  Partes: 'Partes',
  Notas: 'Notas',
  Calendario: 'Calendario',
  Riesgos: 'Riesgos',
  Citas: 'Citas jurídicas',
  Refundamentacion: 'Refundamentación',
  HorasYGastos: 'Horas y Gastos',
  Lecciones: 'Lecciones aprendidas',
  Comentarios: 'Comentarios',
  Tareas: 'Tareas',
  Juez: 'Perspectiva del juez',
  Evidencia: 'Verificación de evidencia',
};
