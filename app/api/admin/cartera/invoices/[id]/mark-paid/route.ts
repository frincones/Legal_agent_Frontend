import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/cartera/invoices/${ctx.params.id}/mark-paid`, { method: 'POST' });
}
