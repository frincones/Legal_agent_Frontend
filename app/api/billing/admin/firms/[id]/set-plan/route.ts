import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/billing/admin/firms/${ctx.params.id}/set-plan`, { method: 'POST' });
}
