import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const { case_label } = (await req.json()) as { case_label?: string };
  const label = (case_label ?? '').trim();
  if (label.length === 0) {
    return NextResponse.json({ error: 'case_label requerido' }, { status: 400 });
  }
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('calc_prescripciones')
    .update({ case_label: label })
    .eq('id', ctx.params.id)
    .eq('firm_id', principal.firm_id)
    .select('id, case_label')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from('calc_prescripciones')
    .delete()
    .eq('id', ctx.params.id)
    .eq('firm_id', principal.firm_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
