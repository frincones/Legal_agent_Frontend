import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/admin-users/${ctx.params.id}`, { method: 'PATCH' });
}
