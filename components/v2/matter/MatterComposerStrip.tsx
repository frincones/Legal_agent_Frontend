'use client';

/**
 * F4-T08 · LexAI UX v2 — MatterComposerStrip
 *
 * Zona de compositor sticky al fondo de la página de caso (/v2/casos/[id]).
 * Renderiza ComposerV2WithStream contextualizado al matterId actual.
 *
 * Solo se monta cuando NEXT_PUBLIC_UX_V2_COMPOSER=true.
 * Si el flag está OFF el componente retorna null sin romper nada.
 *
 * Escucha también el evento 'lexai:open-composer-with-skill' para que el
 * skill seleccionado desde el sidebar se refleje en el compositor de este caso.
 */

import { ComposerV2WithStream } from '@/components/v2/composer/ComposerV2WithStream';

const UX_V2_COMPOSER = process.env.NEXT_PUBLIC_UX_V2_COMPOSER === 'true';

interface MatterComposerStripProps {
  matterId: string;
}

export function MatterComposerStrip({ matterId }: MatterComposerStripProps) {
  // Si el flag no está ON, no renderizar nada — zero regression al legacy
  if (!UX_V2_COMPOSER) return null;

  return (
    <div
      id="matter-composer-strip"
      className="shrink-0 border-t flex flex-col"
      style={{
        borderColor: 'var(--v2-border-subtle, #E8E7E1)',
        minHeight: '72px',
        maxHeight: '40vh',
      }}
    >
      <ComposerV2WithStream
        matterId={matterId}
        placeholder="Preguntele algo a LexAI sobre este caso..."
        autoFocus={false}
        activeTab="matter"
        className="flex-1 min-h-0"
      />
    </div>
  );
}
