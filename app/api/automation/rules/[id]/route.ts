import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/automation/rules/${params.id}`);
}
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/automation/rules/${params.id}`, { method: 'PATCH' });
}
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/automation/rules/${params.id}`, { method: 'DELETE' });
}
