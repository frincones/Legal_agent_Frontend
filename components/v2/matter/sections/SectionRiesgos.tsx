'use client';

/**
 * F4-T06 · SectionRiesgos — Riesgos del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 * Reutiliza RiesgosTab completamente.
 */

import { RiesgosTab } from '@/components/matter/RiesgosTab';

interface Props {
  matterId: string;
}

export function SectionRiesgos({ matterId }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <RiesgosTab matterId={matterId} />
    </div>
  );
}
