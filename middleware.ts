import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/inicio', '/casos', '/clientes', '/documentos', '/calendario', '/notificaciones', '/liquidacion', '/settings', '/admin', '/wizard'];
const AUTH_REDIRECT = '/login';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Refresh session cookie if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_REDIRECT;
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // If logged in and visiting /login or /signup → redirect to /inicio
  // EXCEPT: don't redirect if we're handling OAuth callback (path starts with /auth/)
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    return NextResponse.redirect(url);
  }
  // /auth/callback is intentionally NOT protected · OAuth needs to land there sin auth pre-existente

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, public assets
     * - api routes (handled by their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
