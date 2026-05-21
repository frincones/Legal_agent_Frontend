'use client';

/**
 * F4-T06 · SectionComentarios — Comentarios del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { CommentsThread } from '@/components/collab/CommentsThread';

interface Props {
  matterId: string;
}

export function SectionComentarios({ matterId }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[12px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        Comentarios anclados al caso. Usa @ para mencionar a alguien del despacho.
      </p>
      <CommentsThread anchor={{ kind: 'matter', matter_id: matterId }} />
    </div>
  );
}
