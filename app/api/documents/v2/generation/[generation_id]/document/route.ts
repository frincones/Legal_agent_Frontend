/**
 * GET /api/documents/v2/generation/[generation_id]/document
 *
 * M21.HOTFIX-3: proxy a backend para resolver document_id desde generation_id.
 * Usado como fallback cuando el SSE stream se cerró sin evento 'done' (proxy
 * timeout, server crash post-blocks). Permite al canvas chat composer recuperar
 * el documentId y no quedar bloqueado con "Espera a que termine la generación".
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { generation_id: string } }
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

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? "http://localhost:8000";
  const url = `${apiBase}/v1/documents/v2/generation/${encodeURIComponent(params.generation_id)}/document`;

  try {
    const upstream = await fetch(url, {
      headers: {
        authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "network_error", detail: String(e) }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}
