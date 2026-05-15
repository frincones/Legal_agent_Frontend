import { proxyToRailway } from '@/lib/api/proxy';

export async function PUT(req: Request, ctx: { params: { code: string } }) {
  return proxyToRailway(req, `/v1/admin/plans/${ctx.params.code}/quotas`, { method: 'PUT' });
}
