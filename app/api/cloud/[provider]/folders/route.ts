/**
 * Sprint C · proxy `/api/cloud/[provider]/folders`
 * GET → /v1/cloud/{provider}/folders[?parent_id=...]
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const path = `/v1/cloud/${params.provider}/folders${qs ? '?' + qs : ''}`;
  return proxyToRailway(req, path);
}
