/**
 * Fast session reader for RSC.
 *
 * supabase.auth.getUser() does a roundtrip to /auth/v1/user (~600-800ms).
 * supabase.auth.getSession() is local-cookie-only (<1ms) but doesn't
 * verify the JWT.
 *
 * Trust model: the middleware already calls getUser() once per request
 * and refreshes the cookie. By the time the RSC runs, the cookie is
 * known-valid. We can safely decode the JWT locally for downstream
 * queries.
 */
import { createClient } from '@/lib/supabase/server';

export type SessionPrincipal = {
  user_id: string;
  email: string | null;
  firm_id: string | null;
  role: string | null;
  cedula_profesional: string | null;
  exp: number;
};

function b64uDecode(s: string): string {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf-8');
  // edge runtime
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(b64uDecode(parts[1]!));
  } catch {
    return null;
  }
}

/** Reads session from cookie and decodes the access token locally.
 *  Returns null when no session — caller should redirect or render
 *  unauthenticated state.
 */
export async function getSessionPrincipal(): Promise<SessionPrincipal | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const claims = decodeJwt(session.access_token);
  if (!claims) return null;

  const sub = (claims.sub as string | undefined) ?? null;
  if (!sub) return null;

  const appMd = (claims.app_metadata as Record<string, unknown> | undefined) ?? {};
  const userMd = (claims.user_metadata as Record<string, unknown> | undefined) ?? {};

  return {
    user_id: sub,
    email: (claims.email as string | undefined) ?? null,
    firm_id:
      (claims.firm_id as string | undefined) ??
      (appMd.firm_id as string | undefined) ??
      (userMd.firm_id as string | undefined) ??
      null,
    role:
      (claims.role_lexai as string | undefined) ??
      (appMd.role as string | undefined) ??
      'lawyer',
    cedula_profesional:
      (claims.cedula_profesional as string | undefined) ??
      (userMd.cedula_profesional as string | undefined) ??
      null,
    exp: typeof claims.exp === 'number' ? claims.exp : 0,
  };
}

/** Returns the access_token directly when you only need the bearer for
 *  Railway calls (no decoding). */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
