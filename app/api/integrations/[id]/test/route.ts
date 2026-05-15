/**
 * Sprint A · proxy `/api/integrations/[id]/test`
 * POST → /v1/integrations/{id}/test (ping conectividad)
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return proxyToRailway(req, `/v1/integrations/${params.id}/test`);
}
