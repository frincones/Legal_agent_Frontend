/** GET /api/admin/citations/shadow-diffs — proxy a backend. */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 });
  }
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? "http://localhost:8000";
  const url = new URL(`${apiBase}/v1/admin/citations/shadow-diffs`);
  const critical = req.nextUrl.searchParams.get("critical_only");
  const limit = req.nextUrl.searchParams.get("limit");
  if (critical) url.searchParams.set("critical_only", critical);
  if (limit) url.searchParams.set("limit", limit);
  try {
    const r = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "network_error", detail: String(e) }), { status: 503 });
  }
}
