/**
 * GET /api/assistant/threads
 *
 * Lista los threads (hilos) de conversación del asistente para el firm actual.
 * Proxy al backend real GET /v1/threads?limit=50 (disponible desde commit 6f258c9).
 *
 * Fallback silencioso a lista vacía si el backend no responde,
 * para no romper el sidebar en caso de error transitorio.
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

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

  try {
    const res = await fetch(`${apiBase}/v1/threads?limit=50`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Fallback silencioso — no romper el sidebar con un error de backend
      return NextResponse.json({ threads: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Error de red — fallback silencioso
    return NextResponse.json({ threads: [] });
  }
}
