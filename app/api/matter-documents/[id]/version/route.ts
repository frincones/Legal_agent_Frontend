import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

/** POST /api/matter-documents/{id}/version  body: { html }
 *  Inserta una nueva versión del documento. Idempotent if html unchanged. */
export async function POST(req: Request, ctx: { params: { id: string } }) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const documentId = ctx.params.id;
  const { html } = (await req.json()) as { html?: string };
  if (typeof html !== 'string') {
    return NextResponse.json({ error: 'html requerido' }, { status: 400 });
  }

  const svc = createServiceClient();
  // Confirmar que el documento existe y pertenece al firm.
  const { data: doc } = await svc
    .from('matter_documents')
    .select('id')
    .eq('id', documentId)
    .eq('firm_id', principal.firm_id)
    .maybeSingle();
  if (!doc) {
    return NextResponse.json({ error: 'documento no encontrado' }, { status: 404 });
  }

  // Skip si el HTML es idéntico al último (evita versiones innecesarias por autosave).
  const { data: prev } = await svc
    .from('matter_document_versions')
    .select('version, diff_from_prev')
    .eq('matter_document_id', documentId)
    .eq('firm_id', principal.firm_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const prevHtml = (prev as { diff_from_prev?: { html?: string } } | null)?.diff_from_prev?.html;
  if (prevHtml === html) {
    return NextResponse.json({
      version_id: null,
      version: (prev as { version?: number } | null)?.version ?? 0,
      noop: true,
    });
  }

  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const nextVersion = ((prev as { version?: number } | null)?.version ?? 0) + 1;
  const { data: created, error } = await svc
    .from('matter_document_versions')
    .insert({
      matter_document_id: documentId,
      firm_id: principal.firm_id,
      version: nextVersion,
      generated_by: 'canvas_editor',
      diff_from_prev: { html, text, byte_size: html.length },
    })
    .select('id, version')
    .single();
  if (error || !created) {
    return NextResponse.json(
      { error: error?.message ?? 'failed to insert version' },
      { status: 500 },
    );
  }
  return NextResponse.json({
    version_id: (created as { id: string }).id,
    version: (created as { version: number }).version,
  });
}
