/**
 * Sprint A · proxy `/api/integrations/[id]`
 * DELETE → /v1/integrations/{id} (revoca)
 * POST → no aplica · usar /test directamente
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  return proxyToRailway(req, `/v1/integrations/${params.id}`, { method: 'DELETE' });
}
