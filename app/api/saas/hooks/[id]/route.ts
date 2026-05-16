import { proxyToRailway } from '@/lib/api/proxy';
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/saas/hooks/${params.id}`, { method: 'PATCH' });
}
