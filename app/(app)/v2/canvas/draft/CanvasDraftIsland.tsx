'use client';

/**
 * Client island del Canvas Draft.
 * Recibe el contenido ya decodificado del Server Component padre y renderiza
 * el split view: thread del agente (izq) + editor TipTap (der).
 *
 * BUG #1 FIX: usa ThreadCanvasSplit en lugar de CanvasV2 solo, para que el
 * thread del agente esté visible a la izquierda mientras se edita el documento.
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ThreadCanvasSplit } from '@/components/v2/canvas/ThreadCanvasSplit';
import { IntegratedGenerationCanvas } from '@/components/v2/document-gen/v2/IntegratedGenerationCanvas';

interface CanvasDraftIslandProps {
  initialContent: string;
  engine?: 'v2' | 'legacy';
  intent?: string;
  templateId?: string;
  matterId?: string;
}

export function CanvasDraftIsland({
  initialContent,
  engine = 'legacy',
  intent,
  templateId,
  matterId,
}: CanvasDraftIslandProps) {
  const router = useRouter();
  const isV2 = engine === 'v2' && !!intent;

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Barra superior simplificada */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid var(--v2-border-default, #DDDBD3)',
          backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--v2-border-subtle, #E8E7E1)',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--v2-text-secondary, #4A4944)',
          }}
        >
          <ArrowLeft size={13} aria-hidden />
          Volver
        </button>

        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--v2-text-primary, #1A1916)',
          }}
        >
          {isV2 ? 'Generación con motor v2' : 'Documento generado por LexAI'}
        </span>

        <span
          style={{
            fontSize: 11,
            color: 'var(--v2-text-tertiary, #807E76)',
            marginLeft: 4,
          }}
        >
          {isV2
            ? 'Block streaming · Timeline · Audit · Regenerate'
            : 'Vista preliminar — los cambios no se guardan'}
        </span>
        {isV2 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: 'var(--v2-accent-copper, #B8763C)',
              color: 'white',
              marginLeft: 8,
            }}
          >
            v2
          </span>
        )}
      </div>

      {/* Split view */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {isV2 ? (
          <IntegratedGenerationCanvas
            intent={intent || ''}
            templateId={templateId}
            matterId={matterId}
          />
        ) : initialContent ? (
          <ThreadCanvasSplit
            matterId={null}
            docId="draft"
            initialContent={initialContent}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--v2-text-tertiary, #807E76)',
              fontSize: 14,
            }}
          >
            No se encontró contenido para mostrar.
          </div>
        )}
      </div>
    </main>
  );
}
