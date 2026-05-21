'use client';

/**
 * F4-T06 · SectionCitas — Citas jurídicas del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 * Reutiliza CitasTab completamente.
 */

import { CitasTab } from '@/components/matter/CitasTab';

interface Props {
  matterId: string;
}

export function SectionCitas({ matterId }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <CitasTab matterId={matterId} />
    </div>
  );
}
