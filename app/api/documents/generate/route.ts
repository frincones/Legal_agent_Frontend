/**
 * POST /api/documents/generate
 *
 * Proxy SSE al backend Railway POST /v1/documents/generate.
 * Devuelve streaming text/event-stream con eventos del orchestrator
 * de generacion de documentos:
 *   meta, section_started, section_delta, section_done,
 *   verification_progress, verification_done, quality_score, done, error
 *
 * Si feature flag NEXT_PUBLIC_DOC_GEN_V2_ENABLED=false, devuelve 404
 * (el composer NO debe llamar a este endpoint sin el flag).
 *
 * Auth: requiere session Supabase. Forwardea el access_token al backend
 * para validacion + RLS multi-tenant.
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min para documentos largos

export async function POST(req: NextRequest) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_DOC_GEN_V2_ENABLED !== 'true') {
    return new Response(JSON.stringify({ error: 'doc_gen_v2_disabled' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const backendUrl = `${apiBase}/v1/documents/generate`;

  try {
    const upstream = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: req.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      console.error('[documents/generate] backend error', upstream.status, text.slice(0, 300));
      return new Response(JSON.stringify({ error: 'backend_error', status: upstream.status }), {
        status: upstream.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Forward stream tal cual
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[documents/generate] network error', msg);
    return new Response(JSON.stringify({ error: 'network_error', detail: msg }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
}
