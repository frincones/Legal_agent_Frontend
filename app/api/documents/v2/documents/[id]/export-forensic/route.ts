/**
 * GET/POST /api/documents/v2/documents/[id]/export-forensic
 *
 * M19.14.A — Proxy al backend para descargar el .docx forense.
 * Soporta window.open() (GET con cookie de sesión Supabase) porque corre
 * en el mismo origen que el frontend; resuelve el access_token en el server,
 * lo añade como Bearer al backend y devuelve el binary blob con headers de
 * descarga.
 */
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function proxyExport(req: NextRequest, params: { id: string }) {
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
  const url = `${apiBase}/v1/documents/v2/documents/${encodeURIComponent(params.id)}/export-forensic`;

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: { authorization: `Bearer ${session.access_token}` },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
      });
    }

    const blob = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") ||
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const disposition =
      upstream.headers.get("content-disposition") ||
      `attachment; filename="documento_${params.id.slice(0, 8)}.docx"`;

    return new Response(blob, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition": disposition,
        "cache-control": "private, max-age=300",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "network_error", detail: String(e) }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyExport(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyExport(req, params);
}
