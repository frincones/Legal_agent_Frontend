/**
 * Sprint C · proxy `/api/cloud/watchers/[id]/sync-now`
 * POST → /v1/cloud/watchers/{id}/sync-now
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return proxyToRailway(req, `/v1/cloud/watchers/${params.id}/sync-now`);
}
