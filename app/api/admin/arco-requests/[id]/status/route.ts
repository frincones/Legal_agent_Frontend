import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/arco-requests/${ctx.params.id}/status`, { method: 'POST' });
}
