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
      // Log error para diagnóstico — retorna lista vacía para no romper el sidebar
      const errText = await res.text().catch(() => '');
      console.error('[threads proxy] backend error', res.status, errText.slice(0, 300));
      return NextResponse.json({ threads: [], _upstream_status: res.status });
    }

    const data = await res.json();
    // Normalizar: el backend puede devolver array plano O { threads: [...] }
    const threads = Array.isArray(data)
      ? data
      : (Array.isArray(data?.threads) ? data.threads : []);
    return NextResponse.json({ threads });
  } catch (err) {
    // Error de red — loguear y retornar lista vacía
    console.error('[threads proxy] network error', err);
    return NextResponse.json({ threads: [], _network_error: String(err) });
  }
}
