'use client';

/**
 * components/v2/document-gen/CanvasGenerateIsland.tsx
 *
 * Client island para /v2/canvas/generate (flow V2 de generacion de documentos
 * con streaming + verificacion citas + scorecard).
 *
 * Lee query params (intent, matter_id, brief) + feature flag y monta
 * DocumentStreamingCanvas con los params adecuados.
 *
 * NO confundir con /v2/canvas/draft (ruta legacy con ?content=base64).
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { DocumentStreamingCanvas } from './DocumentStreamingCanvas';
import { detectDocumentIntent } from '@/lib/v2/document-gen/intentDetector';

export function CanvasGenerateIsland() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intent = searchParams.get('intent') ?? '';
  const matterId = searchParams.get('matter_id');
  const userBrief = searchParams.get('brief') ?? '';
  const [flagEnabled, setFlagEnabled] = useState<boolean | null>(null);

  // Verificar feature flag (puede venir de window porque NEXT_PUBLIC es publico)
  useEffect(() => {
    const flag = process.env.NEXT_PUBLIC_DOC_GEN_V2_ENABLED === 'true';
    setFlagEnabled(flag);
  }, []);

  if (flagEnabled === null) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
        Cargando...
      </div>
    );
  }

  if (!flagEnabled) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div
          className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm"
          style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
        >
          <AlertTriangle size={32} className="mx-auto text-amber-500" aria-hidden />
          <h3
            className="mt-3 text-[18px] font-semibold"
            style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}
          >
            Generación V2 deshabilitada
          </h3>
          <p
            className="mt-2 text-[13px]"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          >
            Esta función está en desarrollo. Mientras tanto, usa el composer en /v2/inicio.
          </p>
          <Link
            href="/v2/inicio"
            className="mt-4 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
          >
            <ArrowLeft size={12} aria-hidden />
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!intent.trim()) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div
          className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm"
          style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
        >
          <h3
            className="text-[18px] font-semibold"
            style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}
          >
            Falta el intent
          </h3>
          <p
            className="mt-2 text-[13px]"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          >
            Escribe qué documento quieres generar en el composer de /v2/inicio.
          </p>
          <Link
            href="/v2/inicio"
            className="mt-4 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
          >
            <ArrowLeft size={12} aria-hidden />
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  // Detectar materia + doc_type del intent
  const detection = detectDocumentIntent(intent);

  return (
    <DocumentStreamingCanvas
      intent={intent}
      userBrief={userBrief || undefined}
      matterId={matterId}
      materia={detection.materia}
      docType={detection.docType}
      onComplete={(docId) => {
        // Navegar a la vista del documento generado en el caso
        if (matterId) {
          router.push(`/v2/casos/${matterId}/canvas/${docId}`);
        }
      }}
    />
  );
}
