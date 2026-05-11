import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/client-portal/tokens/${params.id}`, { method: 'DELETE' });
}
