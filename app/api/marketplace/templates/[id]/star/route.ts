import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/marketplace/templates/${params.id}/star`, { method: 'POST' });
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/marketplace/templates/${params.id}/star`, { method: 'DELETE' });
}
