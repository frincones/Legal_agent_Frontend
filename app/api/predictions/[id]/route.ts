import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/predictions/${params.id}`, { method: 'DELETE' });
}
