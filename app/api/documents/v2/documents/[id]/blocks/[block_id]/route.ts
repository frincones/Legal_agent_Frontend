/**
 * M19.16.F5 — Proxy Next.js para PATCH inline edit de un bloque.
 *
 * El frontend (EditableDocxCanvas) llama a:
 *   PATCH /api/documents/v2/documents/[id]/blocks/[block_id]
 *
 * Este handler resuelve la sesión Supabase, añade Bearer al backend y
 * forwardea el body. La respuesta incluye el bloque actualizado, info de
 * snapshot version y flag cache_invalidated.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; block_id: string } }
) {
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

  const body = await req.text();
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? "http://localhost:8000";
  const url =
    `${apiBase}/v1/documents/v2/documents/${encodeURIComponent(params.id)}` +
    `/blocks/${encodeURIComponent(params.block_id)}`;

  try {
    const upstream = await fetch(url, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "network_error", detail: String(e) }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }
}
