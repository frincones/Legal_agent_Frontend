/**
 * F4 · Proxy para el resumen ejecutivo del MatterExecutiveSummary.
 * Invoca /v1/skills/execute con skill='/ask' y el prompt del caso.
 *
 * POST /api/skills/ask
 * Body: { input: string, matter_id?: string, context?: object }
 */
import { NextResponse } from 'next/server';
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!body || typeof (body as Record<string, unknown>).input !== 'string') {
    return NextResponse.json({ error: 'input requerido' }, { status: 400 });
  }

  // Envolver en el formato que acepta /v1/skills/execute
  // Contrato real validado en MatterActions.tsx:239:
  //   { command: '/ask', matter_id, input: { prompt, matter_titulo } }
  const payload = {
    command: '/ask',
    matter_id: (body as Record<string, unknown>).matter_id ?? null,
    input: {
      prompt: (body as Record<string, unknown>).input,
      matter_titulo: (body as Record<string, unknown>).matter_titulo ?? undefined,
    },
  };

  // Crear nueva Request con el body transformado
  const transformedReq = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(payload),
  });

  return proxyToRailway(transformedReq, '/v1/skills/execute');
}
