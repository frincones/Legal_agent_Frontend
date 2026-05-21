/**
 * POST /api/canvas/draft
 *
 * Crea un documento temporal en el canvas a partir de contenido generado
 * por el agente (bloques <plantilla-doc>). Retorna el docId para navegar
 * a /v2/canvas/[docId].
 *
 * TODO: conectar con el backend real cuando exista POST /v1/canvas/draft
 * que cree un matter_document temporal con el contenido en markdown/html.
 *
 * Por ahora retorna un stub con el contenido en base64 para que el
 * DocumentArtifact pueda navegar a la ruta de canvas con query param.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== 'string') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  // TODO: llamar al backend real para crear un matter_document temporal:
  // const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  // const res = await fetch(`${apiBase}/v1/canvas/draft`, {
  //   method: 'POST',
  //   headers: {
  //     authorization: `Bearer ${session.access_token}`,
  //     'content-type': 'application/json',
  //   },
  //   body: JSON.stringify({ content: body.content, title: body.title ?? 'Documento generado' }),
  //   cache: 'no-store',
  // });
  // if (res.ok) {
  //   const data = await res.json();
  //   return NextResponse.json({ docId: data.id });
  // }

  // Stub: encapsular el contenido en base64 para pasarlo por query param
  // El canvas page detectará ?draft=<base64> y cargará el contenido directamente.
  const encoded = Buffer.from(body.content, 'utf-8').toString('base64url');
  return NextResponse.json({ draft: encoded });
}
