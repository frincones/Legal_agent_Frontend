import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, ctx: { params: { key: string } }) {
  return proxyToRailway(req, `/v1/admin/feature-flags/${ctx.params.key}/firms`);
}
