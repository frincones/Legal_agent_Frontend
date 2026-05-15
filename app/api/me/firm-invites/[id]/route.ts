import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/me/firm-invites/${ctx.params.id}`, { method: 'DELETE' });
}
