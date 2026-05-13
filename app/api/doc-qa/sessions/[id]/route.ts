import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/doc-qa/sessions/${params.id}`);
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/doc-qa/sessions/${params.id}`, { method: 'DELETE' });
}
