import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

/** PATCH /api/calc/liquidacion/[id] · rename trabajador.
 *  DELETE /api/calc/liquidacion/[id] · soft-delete the saved calc.
 *  Both scoped by firm_id (defense-in-depth on top of RLS). */

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const principal = await getSessionPrincipal();
  if (!principal?.firm_id) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const { trabajador_nombre } = (await req.json()) as { trabajador_nombre?: string };
  const name = (trabajador_nombre ?? '').trim();
  if (name.length === 0) {
    return NextResponse.json({ error: 'trabajador_nombre requerido' }, { status: 400 });
  }
  const svc = createServiceClient();
  const { data, error } = await svc
    .from('liquidacion_calculations')
    .update({ trabajador_nombre: name })
    .eq('id', ctx.params.id)
    .eq('firm_id', principal.firm_id)
    .select('id, trabajador_nombre')
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
    .from('liquidacion_calculations')
    .delete()
    .eq('id', ctx.params.id)
    .eq('firm_id', principal.firm_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
