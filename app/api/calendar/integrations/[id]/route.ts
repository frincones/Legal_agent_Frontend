import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/calendar/integrations/${params.id}`, { method: 'PATCH' });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/calendar/integrations/${params.id}`, { method: 'DELETE' });
}
