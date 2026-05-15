import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request, ctx: { params: { id: string; moduleKey: string } }) {
  return proxyToRailway(
    req,
    `/v1/admin/firms/${ctx.params.id}/module-overrides/${ctx.params.moduleKey}`,
    { method: 'DELETE' },
  );
}
