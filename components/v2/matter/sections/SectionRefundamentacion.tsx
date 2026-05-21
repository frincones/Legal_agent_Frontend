'use client';

/**
 * F4-T06 · SectionRefundamentacion — Refundamentación entre instancias.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { RefundamentacionTab } from '@/components/matter/RefundamentacionTab';

interface Props {
  matterId: string;
  instance?: string | null;
}

export function SectionRefundamentacion({ matterId, instance }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <RefundamentacionTab matterId={matterId} instance={instance} />
    </div>
  );
}
