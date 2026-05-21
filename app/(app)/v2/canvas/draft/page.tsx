'use client';

/**
 * F3-T09 (apoyo) · LexAI UX v2 — Canvas Draft
 *
 * Página temporal que recibe contenido de documento generado por el agente
 * vía query param ?content=<base64url> y lo muestra en el editor CanvasV2.
 *
 * Ruta: /v2/canvas/draft?content=<base64url>
 *
 * Contexto: cuando el agente retorna un bloque <plantilla-doc> y el backend
 * aún no tiene soporte para crear matter_documents temporales, el
 * DocumentArtifact navega aquí con el contenido codificado.
 *
 * TODO: cuando el backend implemente POST /v1/canvas/draft, este stub dejará
 * de ser necesario — DocumentArtifact navegará directamente a /v2/canvas/[docId].
 */

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { CanvasV2 } from '@/components/v2/canvas/CanvasV2';
import { ArrowLeft } from 'lucide-react';

function CanvasDraftContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const encoded = searchParams.get('content') ?? '';

  let initialContent = '';
  if (encoded) {
    try {
      // base64url → texto UTF-8
      const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      initialContent = decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      );
    } catch {
      // Si falla el decode, mostrar el encoded como texto plano
      initialContent = encoded;
    }
  }

  return (
    <AppShell active="inicio">
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
            <CanvasV2
              docId="draft"
              initialContent={initialContent}
              readonly={false}
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
    </AppShell>
  );
}

export default function CanvasDraftPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            color: 'var(--v2-text-tertiary, #807E76)',
            fontSize: 14,
          }}
        >
          Cargando documento…
        </div>
      }
    >
      <CanvasDraftContent />
    </Suspense>
  );
}
