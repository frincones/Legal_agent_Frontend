import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(req: Request, ctx: { params: { slug: string } }) {
  return proxyToRailway(req, `/v1/admin/testimonials/${ctx.params.slug}`, { method: 'PATCH' });
}

export async function DELETE(req: Request, ctx: { params: { slug: string } }) {
  return proxyToRailway(req, `/v1/admin/testimonials/${ctx.params.slug}`, { method: 'DELETE' });
}
