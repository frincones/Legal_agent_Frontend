import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/status/incidents/${ctx.params.id}`, { method: 'PATCH' });
}
