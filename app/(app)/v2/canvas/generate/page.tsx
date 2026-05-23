/**
 * /v2/canvas/generate
 *
 * Ruta del flow V2 de generacion de documentos legales con streaming.
 *
 * Diferencia con /v2/canvas/draft (legacy):
 *   - /v2/canvas/draft       legacy. Recibe ?content=<base64> y muestra
 *                            doc completo en ThreadCanvasSplit.
 *   - /v2/canvas/generate    nuevo (Sprint L-DOC). Recibe ?intent=...
 *                            y arranca SSE contra /api/documents/generate.
 *
 * Feature flag: NEXT_PUBLIC_DOC_GEN_V2_ENABLED. Sin flag muestra
 * mensaje "deshabilitada".
 */
import { Suspense } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { CanvasGenerateIsland } from '@/components/v2/document-gen/CanvasGenerateIsland';

export const dynamic = 'force-dynamic';

export default function CanvasGeneratePage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Canvas · Generación V2"
          title="Generación de documento legal"
          subtitle="Streaming en tiempo real · verificación de citas automática · scorecard de calidad"
        />
        <Suspense fallback={<div className="p-6 text-[13px] text-[var(--v2-text-tertiary,#807E76)]">Cargando...</div>}>
          <CanvasGenerateIsland />
        </Suspense>
      </main>
    </AppShell>
  );
}
