import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

/** GET /api/matter-documents/canvas?matter_id=X
 *  → { document_id, html, version }
 *  Resuelve (o crea) el documento "canvas" de un matter y devuelve la
 *  última versión guardada.
 *
 *  POST /api/matter-documents/canvas?matter_id=X  body: { html }
 *  → { document_id, version_id, version }
 *  Guarda una nueva versión del documento canvas. Auto-crea el
 *  matter_document si no existe.
 */

const CANVAS_KIND = 'generado';
const CANVAS_TITULO_PREFIX = 'Canvas';

async function _ensureCanvasDocument(
  svc: ReturnType<typeof createServiceClient>,
  firmId: string,
  matterId: string,
  userId: string,
): Promise<{ id: string; titulo: string }> {
  const { data: existing } = await svc
    .from('matter_documents')
    .select('id, titulo')
    .eq('matter_id', matterId)
    .eq('firm_id', firmId)
    .like('titulo', `${CANVAS_TITULO_PREFIX}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as { id: string; titulo: string };

  const { data: matter } = await svc
    .from('matters')
    .select('display_id, titulo')
    .eq('id', matterId)
    .single();
  const titulo = `Canvas · ${matter?.display_id ?? matterId.slice(0, 8)}`;

  const { data: created, error } = await svc
    .from('matter_documents')
    .insert({
      matter_id: matterId,
      firm_id: firmId,
      // Schema column is `uploaded_by` (not uploader_id)
      uploaded_by: userId,
      kind: CANVAS_KIND,
      titulo,
      // doc_status enum: pending | processing | completed | failed | superseded
      status: 'completed',
      pages: 1,
    })
    .select('id, titulo')
    .single();
  if (error || !created) {
    throw new Error(
      `failed to create canvas document: ${error?.message ?? 'unknown'} ` +
      `(code=${error?.code ?? 'n/a'}, details=${error?.details ?? 'n/a'})`,
    );
  }
  return created as { id: string; titulo: string };
}

export async function GET(req: Request) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const matterId = url.searchParams.get('matter_id');
  if (!matterId) {
    return NextResponse.json({ error: 'matter_id requerido' }, { status: 400 });
  }
  const svc = createServiceClient();
  try {
    const doc = await _ensureCanvasDocument(svc, principal.firm_id, matterId, principal.user_id);
    const { data: ver } = await svc
      .from('matter_document_versions')
      .select('id, version, diff_from_prev')
      .eq('matter_document_id', doc.id)
      .eq('firm_id', principal.firm_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const diff = (ver as { diff_from_prev?: { html?: string } } | null)?.diff_from_prev;
    const html = (diff && typeof diff.html === 'string' ? diff.html : '') ?? '';
    return NextResponse.json({
      document_id: doc.id,
      titulo: doc.titulo,
      html,
      version: ver?.version ?? 0,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const matterId = url.searchParams.get('matter_id');
  if (!matterId) {
    return NextResponse.json({ error: 'matter_id requerido' }, { status: 400 });
  }
  const { html } = (await req.json()) as { html?: string };
  if (typeof html !== 'string') {
    return NextResponse.json({ error: 'html requerido' }, { status: 400 });
  }
  const svc = createServiceClient();
  try {
    const doc = await _ensureCanvasDocument(svc, principal.firm_id, matterId, principal.user_id);
    const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const { data: prev } = await svc
      .from('matter_document_versions')
      .select('version')
      .eq('matter_document_id', doc.id)
      .eq('firm_id', principal.firm_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = ((prev as { version?: number } | null)?.version ?? 0) + 1;
    // matter_document_versions tiene storage_path y sha256 NOT NULL · para
    // canvases inline (sin archivo en bucket) usamos virtual path + hash del HTML.
    const sha = createHash('sha256').update(html).digest('hex');
    const storagePath = `inline://canvas/${doc.id}/v${nextVersion}.html`;
    const { data: created, error } = await svc
      .from('matter_document_versions')
      .insert({
        matter_document_id: doc.id,
        firm_id: principal.firm_id,
        version: nextVersion,
        storage_path: storagePath,
        sha256: sha,
        generated_by: 'canvas_editor',
        diff_from_prev: { html, text, byte_size: html.length },
      })
      .select('id, version')
      .single();
    if (error || !created) {
      const detail = error
        ? `${error.message ?? 'unknown'} (code=${error.code ?? 'n/a'}, hint=${error.hint ?? 'n/a'})`
        : 'failed to insert version (no row returned)';
      console.error('[canvas POST] insert version failed:', detail, error);
      return NextResponse.json({ error: detail }, { status: 500 });
    }
    return NextResponse.json({
      document_id: doc.id,
      version_id: (created as { id: string }).id,
      version: (created as { version: number }).version,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
    console.error('[canvas POST] exception:', msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
