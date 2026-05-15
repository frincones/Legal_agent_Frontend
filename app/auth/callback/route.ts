/**
 * Sprint 29 · OAuth callback handler.
 *
 * Después del flujo OAuth (Google), Supabase redirige aquí con un `code`
 * que intercambiamos por una sesión válida.
 *
 * Casos:
 *   - Usuario nuevo (primera vez): trigger SQL creó fila en public.users
 *     con firm_id=NULL → redirigir a /wizard para que cree/se una a firma.
 *   - Usuario existente con firm: redirect directo a /inicio.
 *   - Error de OAuth: redirect a /login con mensaje.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') || '/inicio';

  if (errorParam) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', errorDescription || errorParam);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'missing_oauth_code');
    return NextResponse.redirect(url);
  }

  const supabase = createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', exchangeError.message);
    return NextResponse.redirect(url);
  }

  // Después del exchange · verificar si el user ya tiene firm
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'no_user_after_oauth');
    return NextResponse.redirect(url);
  }

  // El trigger SQL `lexai_on_auth_user_created` debe haber creado la fila en public.users.
  // Verificamos si tiene firm_id asignado.
  const { data: profile } = await supabase
    .from('users')
    .select('firm_id, modo_ejercicio')
    .eq('id', user.id)
    .maybeSingle();

  // Sin firm_id → primer signup, mandar al wizard
  if (!profile?.firm_id) {
    return NextResponse.redirect(new URL('/wizard?source=oauth', origin));
  }

  // Sin modo_ejercicio → completó signup tradicional pero no wizard
  if (!profile?.modo_ejercicio) {
    return NextResponse.redirect(new URL('/wizard', origin));
  }

  // Todo listo · al destino solicitado o /inicio
  return NextResponse.redirect(new URL(next, origin));
}
