'use client';

/**
 * F4-T06 · SectionEvidencia — Verificación de evidencia.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { EvidenceCheckPanel } from '@/components/evidence/EvidenceCheckPanel';

interface Props {
  matterId: string;
  documents: Array<{
    id: string;
    titulo: string;
    kind: string;
    resumen_ia: string | null;
  }>;
}

export function SectionEvidencia({ matterId, documents }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <EvidenceCheckPanel matterId={matterId} documents={documents} />
    </div>
  );
}
