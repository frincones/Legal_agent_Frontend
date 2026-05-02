import { NextResponse } from 'next/server';

/**
 * Verifica una tarjeta profesional de abogado contra el Consejo Superior
 * de la Judicatura · Registro Nacional de Abogados.
 *
 * Sprint 1: stub que valida formato y retorna `pending` para que el
 *  frontend muestre estado "Por verificar".
 * Sprint 7: scrape real de
 *   https://sirna.ramajudicial.gov.co/SIRNA/InicioConsultaTarjetaProfesional.aspx
 * con Playwright (la página es ASP.NET con viewstate; no hay API pública).
 */
export async function POST(req: Request) {
  const body = (await req.json()) as { tarjeta_profesional?: string; nombre_completo?: string };
  const tp = (body.tarjeta_profesional ?? '').trim();
  if (!/^T?\.?P?\.?\s*\d{5,8}$/i.test(tp.replace(/\s+/g, ''))) {
    return NextResponse.json(
      { ok: false, status: 'invalid_format', message: 'Formato T.P. inválido (esperado 5-8 dígitos)' },
      { status: 400 },
    );
  }
  // TODO Sprint 7: Playwright scrape sirna.ramajudicial.gov.co
  return NextResponse.json({
    ok: true,
    status: 'pending',
    tarjeta_profesional: tp,
    message: 'Verificación contra CSJ encolada · respuesta en 24 h',
  });
}
