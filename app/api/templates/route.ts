/**
 * GET /api/templates
 *
 * Proxy a backend GET /v1/templates (lista catálogo TemplateDef).
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
  const url = new URL(`${apiBase}/v1/templates`);
  const jur = req.nextUrl.searchParams.get("jurisdiccion");
  if (jur) url.searchParams.set("jurisdiccion", jur);

  try {
    const upstream = await fetch(url.toString(), {
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
