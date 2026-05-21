'use client';

/**
 * Client island del Canvas Draft.
 * Recibe el contenido ya decodificado del Server Component padre y renderiza
 * el header + CanvasV2.
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CanvasV2 } from '@/components/v2/canvas/CanvasV2';

interface CanvasDraftIslandProps {
  initialContent: string;
}

export function CanvasDraftIsland({ initialContent }: CanvasDraftIslandProps) {
  const router = useRouter();

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
          Documento generado por LexAI
        </span>

        <span
          style={{
            fontSize: 11,
            color: 'var(--v2-text-tertiary, #807E76)',
            marginLeft: 4,
          }}
        >
          Vista preliminar — los cambios no se guardan
        </span>
      </div>

      {/* Editor canvas con el contenido decodificado */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {initialContent ? (
          <CanvasV2 docId="draft" initialContent={initialContent} readonly={false} />
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
