import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(req: Request, ctx: { params: { key: string } }) {
  return proxyToRailway(req, `/v1/admin/helper-tips/${ctx.params.key}`, { method: 'PATCH' });
}

export async function DELETE(req: Request, ctx: { params: { key: string } }) {
  return proxyToRailway(req, `/v1/admin/helper-tips/${ctx.params.key}`, { method: 'DELETE' });
}
