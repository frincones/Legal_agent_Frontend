/**
 * Sprint A · proxy `/api/integrations`
 * GET → /v1/integrations (lista firm_integrations)
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/integrations');
}
