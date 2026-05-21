'use client';

/**
 * F4-T06 · SectionLecciones — Lecciones aprendidas del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { MatterLessonsTab } from '@/components/matter/MatterLessonsTab';

interface Props {
  matterId: string;
}

export function SectionLecciones({ matterId }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <MatterLessonsTab matterId={matterId} />
    </div>
  );
}
