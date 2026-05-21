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
  searchParams: { content?: string };
}

export default function CanvasDraftPage({ searchParams }: PageProps) {
  const initialContent = decodeContent(searchParams.content);

  return (
    <AppShell active="inicio">
      <CanvasDraftIsland initialContent={initialContent} />
    </AppShell>
  );
}
