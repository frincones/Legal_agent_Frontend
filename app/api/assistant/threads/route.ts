/**
 * GET /api/assistant/threads
 *
 * Lista los threads (hilos) de conversación del asistente para el firm actual.
 *
 * TODO (F2): conectar con el backend real cuando exista GET /v1/threads.
 * El backend necesitaría la tabla assistant_threads o similar con campos:
 *   id, firm_id, user_id, title, created_at, updated_at
 *
 * Por ahora retorna lista vacía para que SidebarHilosList muestre el
 * estado vacío sin errores.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // TODO: cuando el backend tenga el endpoint /v1/threads, hacer proxy aquí:
  // const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  // const res = await fetch(`${apiBase}/v1/threads`, {
  //   headers: { authorization: `Bearer ${session.access_token}` },
  //   cache: 'no-store',
  // });
  // if (res.ok) return NextResponse.json(await res.json());

  // Stub: retorna vacío para activar el estado "Aún no tiene hilos"
  return NextResponse.json({ threads: [] });
}
