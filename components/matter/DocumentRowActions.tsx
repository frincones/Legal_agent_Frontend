'use client';

import { useState } from 'react';
import { Bot, GitCompare, Scale } from 'lucide-react';
import { ContractAnalysisPanel } from '@/components/contract/ContractAnalysisPanel';
import { DocQADrawer } from '@/components/docqa/DocQADrawer';
import { DocCompareDialog } from '@/components/doccompare/DocCompareDialog';

type DocOpt = { id: string; titulo: string };

export function DocumentRowActions({
  documentId,
  documentTitle,
  documents,
}: {
  documentId: string;
  documentTitle: string;
  documents: DocOpt[];
}) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setAnalysisOpen(true)}
          className="btn"
          title="Analizar contrato con IA"
        >
          <Scale size={12} aria-hidden="true" />
        </button>
        <button
          onClick={() => setQaOpen(true)}
          className="btn"
          title="Preguntar al documento"
        >
          <Bot size={12} aria-hidden="true" />
        </button>
        {documents.length >= 2 && (
          <button
            onClick={() => setCompareOpen(true)}
            className="btn"
            title="Comparar con otro documento"
          >
            <GitCompare size={12} aria-hidden="true" />
          </button>
        )}
      </div>

      <ContractAnalysisPanel
        documentId={documentId}
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
      />

      <DocQADrawer
        open={qaOpen}
        onOpenChange={setQaOpen}
        scope={{ kind: 'document', document_ids: [documentId], title: documentTitle }}
      />

      {compareOpen && (
        <DocCompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          documents={documents}
          initialA={documentId}
          initialB={documents.find((d) => d.id !== documentId)?.id}
        />
      )}
    </>
  );
}
