/**
 * GET /api/deadlines?days=N
 *
 * Stub endpoint — retorna lista vacía mientras el backend Railway no expone
 * un endpoint de plazos próximos. El CommandPaletteV2 lo consume al montar
 * para mostrar el grupo "Plazos próximos (7 días)".
 *
 * Cuando el backend implemente GET /v1/deadlines, reemplazar este stub con:
 *   export async function GET(req: Request) { return proxyToRailway(req, '/v1/deadlines'); }
 */
export async function GET() {
  return Response.json({ items: [] });
}
