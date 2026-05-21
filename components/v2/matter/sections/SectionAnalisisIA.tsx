'use client';

/**
 * F4-T06 · SectionAnalisisIA — Análisis IA del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 * Reutiliza AnalisisTab sin tocar su lógica.
 */

import { AnalisisTab, type AnalysisRow } from '@/components/matter/AnalisisTab';

interface Props {
  matterId: string;
  documents: Array<{ id: string; titulo: string; kind: string }>;
  initialAnalyses: AnalysisRow[];
}

export function SectionAnalisisIA({ matterId, documents, initialAnalyses }: Props) {
  return (
    <div className="rounded-xl overflow-hidden">
      <AnalisisTab
        matterId={matterId}
        documents={documents}
        initialAnalyses={initialAnalyses}
      />
    </div>
  );
}
