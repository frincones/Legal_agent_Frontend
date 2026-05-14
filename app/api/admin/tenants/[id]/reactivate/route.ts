import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/tenants/${ctx.params.id}/reactivate`, { method: 'POST' });
}
