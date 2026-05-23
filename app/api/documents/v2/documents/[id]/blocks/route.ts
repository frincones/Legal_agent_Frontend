/**
 * GET /api/documents/v2/documents/[id]/blocks
 *
 * Recupera bloques persistidos de un document_id (refresh canvas).
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
  const url = `${apiBase}/v1/documents/v2/documents/${encodeURIComponent(params.id)}/blocks`;
  try {
    const upstream = await fetch(url, {
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "network_error", detail: String(e) }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}
