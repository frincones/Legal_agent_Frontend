/**
 * F5-T07 · LexAI UX v2 — Canvas split page
 *
 * Server Component que obtiene el matter_document por docId,
 * luego renderiza ThreadCanvasSplit con initialContent.
 *
 * Ruta: /v2/canvas/[docId]
 * Activación: NEXT_PUBLIC_UX_V2_CANVAS=true (el redirect desde el canvas
 *             legacy se hace en F5-T08).
 */

import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { ThreadCanvasSplit } from '@/components/v2/canvas/ThreadCanvasSplit';
import Link from 'next/link';

export const revalidate = 0; // siempre fresh

interface PageProps {
  params: { docId: string };
}

export default async function CanvasV2Page({ params }: PageProps) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    // middleware debería haber redirigido antes; aun así protegemos
    notFound();
  }

  const svc = createServiceClient();

  // Obtener el matter_document
  const { data: doc } = await svc
    .from('matter_documents')
    .select('id, titulo, matter_id')
    .eq('id', params.docId)
    .eq('firm_id', principal.firm_id)
    .maybeSingle();

  if (!doc) notFound();

  // Obtener la última versión HTML
  const { data: ver } = await svc
    .from('matter_document_versions')
    .select('diff_from_prev')
    .eq('matter_document_id', doc.id)
    .eq('firm_id', principal.firm_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const diff = (ver as { diff_from_prev?: { html?: string } } | null)?.diff_from_prev;
  const initialContent = (diff && typeof diff.html === 'string' ? diff.html : '') ?? '';

  const matterId = (doc as { matter_id?: string }).matter_id ?? '';

  // Obtener el matter para el breadcrumb
  const { data: matter } = matterId
    ? await svc.from('matters').select('titulo, display_id').eq('id', matterId).maybeSingle()
    : { data: null };

  const matterTitle = (matter as { titulo?: string; display_id?: string } | null)?.titulo ?? 'Caso';

  return (
    <AppShell active="casos">
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <TopBar
          breadcrumb={
            <>
              <Link href="/casos" style={{ opacity: 0.7 }}>Casos</Link>
              <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>
              {matterId && (
                <>
                  <Link href={`/casos/${matterId}`} style={{ opacity: 0.7 }}>
                    {matterTitle}
                  </Link>
                  <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>
                </>
              )}
              <span style={{ color: 'var(--v2-accent-copper, #B8763C)' }}>
                {(doc as { titulo?: string }).titulo ?? 'Canvas'}
              </span>
            </>
          }
          title={(doc as { titulo?: string }).titulo ?? 'Canvas'}
          subtitle={matterTitle}
        />

        {/* Split view ocupa el resto del alto */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <ThreadCanvasSplit
            matterId={matterId}
            docId={params.docId}
            initialContent={initialContent}
          />
        </div>
      </main>
    </AppShell>
  );
}
