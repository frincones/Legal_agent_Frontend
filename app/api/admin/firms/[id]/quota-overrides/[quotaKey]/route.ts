import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request, ctx: { params: { id: string; quotaKey: string } }) {
  return proxyToRailway(
    req,
    `/v1/admin/firms/${ctx.params.id}/quota-overrides/${ctx.params.quotaKey}`,
    { method: 'DELETE' },
  );
}
