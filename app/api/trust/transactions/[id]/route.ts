import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/trust/transactions/${params.id}`);
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/trust/transactions/${params.id}`, { method: 'DELETE' });
}
