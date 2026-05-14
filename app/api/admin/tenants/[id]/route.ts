import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/tenants/${ctx.params.id}`);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/tenants/${ctx.params.id}`, { method: 'PATCH' });
}
