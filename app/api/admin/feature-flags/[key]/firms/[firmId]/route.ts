import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, ctx: { params: { key: string; firmId: string } }) {
  return proxyToRailway(
    req,
    `/v1/admin/feature-flags/${ctx.params.key}/firms/${ctx.params.firmId}`,
    { method: 'POST' },
  );
}

export async function DELETE(req: Request, ctx: { params: { key: string; firmId: string } }) {
  return proxyToRailway(
    req,
    `/v1/admin/feature-flags/${ctx.params.key}/firms/${ctx.params.firmId}`,
    { method: 'DELETE' },
  );
}
