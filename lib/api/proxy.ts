import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Forward a Next.js Route Handler request to Railway with the user's
 * Supabase session token as Bearer auth.
 *
 * Encapsulates the boilerplate that lived in every handler under
 * app/api/* (citations, hitl, calc, …) and standardizes auth + error
 * responses. Kept intentionally minimal — handlers can still write
 * custom logic when needed.
 */

type ProxyOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Optional override of the body. If omitted and method has body, the
   *  request's raw body is forwarded as-is. */
  body?: unknown;
  /** Extra headers (rare). content-type and authorization are managed. */
  headers?: Record<string, string>;
};

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function proxyToRailway(
  req: Request,
  path: string,
  opts: ProxyOpts = {},
): Promise<NextResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const method = opts.method ?? (req.method as ProxyOpts['method']) ?? 'GET';
  const headers: Record<string, string> = {
    authorization: `Bearer ${session.access_token}`,
    ...(opts.headers ?? {}),
  };

  let bodyInit: BodyInit | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    if (opts.body !== undefined) {
      headers['content-type'] = 'application/json';
      bodyInit = JSON.stringify(opts.body);
    } else {
      headers['content-type'] = req.headers.get('content-type') ?? 'application/json';
      bodyInit = await req.text();
    }
  }

  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers,
    body: bodyInit,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
