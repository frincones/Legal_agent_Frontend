/**
 * POST /api/documents/v2/generate
 *
 * Proxy SSE al backend Railway POST /v1/documents/v2/generate.
 * Eventos block-level (Sprint M Document Generation v3.1).
 *
 * Backend tiene su propio feature flag FLAG_DOCGEN_V2 (default off en prod);
 * el proxy lo respeta — si backend devuelve 503, propaga el status.
 *
 * Auth: requiere session Supabase. Forwardea el access_token.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? "http://localhost:8000";
  const backendUrl = `${apiBase}/v1/documents/v2/generate`;

  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
        accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal: req.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("[documents/v2/generate] backend error", upstream.status, text.slice(0, 300));
      return new Response(JSON.stringify({ error: "backend_error", status: upstream.status, detail: text.slice(0, 300) }), {
        status: upstream.status,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[documents/v2/generate] network error", msg);
    return new Response(JSON.stringify({ error: "network_error", detail: msg }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}
