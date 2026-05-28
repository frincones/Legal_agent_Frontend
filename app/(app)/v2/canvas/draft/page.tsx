/**
 * F3-T09 (apoyo) · LexAI UX v2 — Canvas Draft
 *
 * Página temporal que recibe contenido de documento generado por el agente
 * vía query param ?content=<base64url> y lo muestra en el editor CanvasV2.
 *
 * Ruta: /v2/canvas/draft?content=<base64url>
 *
 * Server Component que envuelve AppShell (server-only por next/headers en
 * lib/supabase/server.ts) y delega la lectura del query param + render del
 * canvas a un Client island (CanvasDraftIsland).
 *
 * TODO: cuando el backend implemente POST /v1/canvas/draft, este stub dejará
 * de ser necesario — DocumentArtifact navegará directamente a /v2/canvas/[docId].
 */

import { AppShell } from '@/components/shell/AppShell';
import { CanvasDraftIsland } from './CanvasDraftIsland';

function decodeContent(encoded: string | undefined): string {
  if (!encoded) return '';
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    return decoded;
  } catch {
    return encoded;
  }
}

interface PageProps {
  searchParams: {
    content?: string;
    engine?: string;
    intent?: string;
    template?: string;
    brief?: string;
    matter_id?: string;
    borrador_mode?: string;
  };
}

export default function CanvasDraftPage({ searchParams }: PageProps) {
  const initialContent = decodeContent(searchParams.content);
  const engine = searchParams.engine === "v2" ? "v2" : "legacy";
  // M19.23.K — borrador_mode default=true. Solo es false si la URL lo dice.
  const borradorMode = searchParams.borrador_mode !== "false";

  return (
    <AppShell active="inicio">
      <CanvasDraftIsland
        initialContent={initialContent}
        engine={engine}
        intent={searchParams.intent}
        templateId={searchParams.template}
        brief={searchParams.brief}
        matterId={searchParams.matter_id}
        borradorMode={borradorMode}
      />
    </AppShell>
  );
}
