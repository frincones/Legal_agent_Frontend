import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/kb/annotations/${params.id}`, { method: 'DELETE' });
}
