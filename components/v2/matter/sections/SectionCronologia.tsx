'use client';

/**
 * F4-T06 · SectionCronologia — Cronología del caso.
 * Estrategia: REESCRITA con tokens v2 y timeline visual.
 * Datos: pasados como props desde el Server Component.
 */

import { formatRelative } from '@/lib/utils';
import { TimelineRebuildButton } from '@/components/matter/TimelineRebuildButton';
import type { TimelineEvent } from '@/lib/api/rsc-fetchers';

interface Props {
  matterId: string;
  timelineEvents: TimelineEvent[];
}

function describeEvent(kind: string, payload: Record<string, unknown>): string {
  switch (kind) {
    case 'matter_created':
      return `Caso creado por ${(payload as { by?: string }).by ?? 'el despacho'}`;
    case 'document_uploaded':
      return `Documento subido: ${(payload as { filename?: string }).filename ?? 'archivo'} (${(payload as { pages?: number }).pages ?? 0} páginas)`;
    case 'agent_calc':
      return `LexAI calculó ${(payload as { tool?: string }).tool ?? 'cálculo'}`;
    case 'agent_draft':
      return `LexAI generó borrador (versión ${(payload as { version?: number }).version ?? 1})`;
    case 'voice_session':
      return `Sesión de voz · ${Math.round(Number((payload as { duration_ms?: number }).duration_ms ?? 0) / 1000)}s · ${(payload as { tool_calls?: number }).tool_calls ?? 0} tools`;
    default:
      return kind.replace(/_/g, ' ');
  }
}

export function SectionCronologia({ matterId, timelineEvents }: Props) {
  if (timelineEvents.length === 0) {
    return (
      <div className="py-4 text-[13px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        Sin eventos registrados todavía.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
          {timelineEvents.length} eventos
        </span>
        <TimelineRebuildButton matterId={matterId} />
      </div>

      <ol className="relative space-y-0 border-l-2 pl-6" style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)', listStyle: 'none', margin: 0, padding: '0 0 0 24px' }}>
        {timelineEvents.map((e) => (
          <li key={e.id} className="relative pb-5">
            {/* Dot */}
            <span
              className="absolute -left-[7px] top-[3px] h-[12px] w-[12px] rounded-full border-2 border-white"
              style={{ background: 'var(--v2-accent-copper, #B8763C)' }}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                {formatRelative(e.ts)}
              </span>
              <span className="text-[13px]" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                {describeEvent(e.kind, e.payload)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
