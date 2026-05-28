/**
 * POST /api/documents/v2/preview-required-fields  (M19.23.K)
 *
 * Proxy al backend POST /v1/documents/v2/preview-required-fields.
 * Devuelve la predicción de campos críticos/opcionales que el agente
 * (gpt-4o) considera necesarios para redactar el documento.
 *
 * Usado por BriefModal para mostrar dinámicamente las preguntas en
 * lugar de tener listas hardcoded por template_id.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const backendUrl = `${apiBase}/v1/documents/v2/preview-required-fields`;

  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: req.signal,
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error(
        "[preview-required-fields] backend error",
        upstream.status,
        text.slice(0, 300),
      );
      return new Response(
        JSON.stringify({
          error: "backend_error",
          status: upstream.status,
          detail: text.slice(0, 300),
        }),
        {
          status: upstream.status,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[preview-required-fields] network error", msg);
    return new Response(
      JSON.stringify({ error: "network_error", detail: msg }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }
}
