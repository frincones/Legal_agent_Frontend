import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024;
const BUCKET = 'matter-docs';

/** Upload a document to the matter's storage prefix and create a
 *  matter_documents row in `pending` status. The backend OCR worker will
 *  pick it up via Supabase Realtime change-feed.  */
export async function POST(req: Request) {
  const principal = await getSessionPrincipal();
  if (!principal || !principal.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get('file');
  const matterId = (form.get('matter_id') as string | null)?.trim();
  if (!matterId) {
    return NextResponse.json({ error: 'matter_id requerido' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file requerido' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'archivo > 25 MB' }, { status: 413 });
  }

  // Confirm the matter belongs to the user's firm (RLS-enforced query).
  const supabase = createClient();
  const { data: matter, error: mErr } = await supabase
    .from('matters')
    .select('id, firm_id')
    .eq('id', matterId)
    .single();
  if (mErr || !matter) {
    return NextResponse.json({ error: 'matter no encontrado' }, { status: 404 });
  }

  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? '.bin').toLowerCase();
  const storagePath = `${principal.firm_id}/${matterId}/${crypto.randomUUID()}${ext}`;

  // Service client for storage write — keeps the upload tx server-side
  // even if the user's session cookie is read-only in this RSC context.
  const svc = createServiceClient();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await svc.storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (upErr) {
    console.error('[upload] storage error:', upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: doc, error: insErr } = await svc
    .from('matter_documents')
    .insert({
      matter_id: matterId,
      firm_id: principal.firm_id,
      uploader_id: principal.user_id,
      kind: ext === '.pdf' ? 'pdf' : ext === '.docx' || ext === '.doc' ? 'docx' : 'txt',
      titulo: file.name,
      storage_path: storagePath,
      byte_size: file.size,
      status: 'pending_ocr',
    })
    .select('id')
    .single();
  if (insErr) {
    console.error('[upload] db error:', insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: doc.id, storage_path: storagePath, status: 'pending_ocr' });
}
