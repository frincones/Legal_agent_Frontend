import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/admin/firms/${ctx.params.id}/entitlements`);
}
