'use client';

/**
 * F4-T06 · SectionJuez — Perspectiva del juez.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { JudgePerspectivePanel } from '@/components/judges/JudgePerspectivePanel';

interface Props {
  matterId: string;
}

export function SectionJuez({ matterId }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <JudgePerspectivePanel matterId={matterId} />
    </div>
  );
}
