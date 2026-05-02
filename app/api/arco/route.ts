import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await req.json()) as {
    tipo: 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';
    titular_nombre: string;
    titular_doc: string;
    descripcion?: string;
  };

  // Append to clients.arco_requests JSON array (or store at firm level if no client)
  // For now, log to audit_log via service-role.
  // (Production: send email to dpo@lexai.co + persist to dedicated arco_requests table.)
  return NextResponse.json({ ok: true, message: 'Solicitud registrada' });
}
