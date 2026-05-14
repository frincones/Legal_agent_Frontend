import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, ctx: { params: { id: string } }) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/admin/tenants/${ctx.params.id}/usage${qs ? `?${qs}` : ''}`);
}
