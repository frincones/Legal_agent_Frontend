/**
 * Sprint A · proxy `/api/integrations/[provider]/start`
 * POST → /v1/integrations/{provider}/start (genera state + auth_url)
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(
  req: Request,
  { params }: { params: { provider: string } }
) {
  return proxyToRailway(req, `/v1/integrations/${params.provider}/start`);
}
