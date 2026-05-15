/**
 * Sprint C · proxy `/api/cloud/watchers/[id]`
 * DELETE → /v1/cloud/watchers/{id}
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  return proxyToRailway(req, `/v1/cloud/watchers/${params.id}`, { method: 'DELETE' });
}
