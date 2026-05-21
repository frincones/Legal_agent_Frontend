'use client';

/**
 * F4-T06 · SectionHorasYGastos — Horas y Gastos del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { HorasGastosTab } from '@/components/billing/HorasGastosTab';

interface Props {
  matterId: string;
}

export function SectionHorasYGastos({ matterId }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <HorasGastosTab matterId={matterId} />
    </div>
  );
}
