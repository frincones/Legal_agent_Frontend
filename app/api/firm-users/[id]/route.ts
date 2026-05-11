import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/firm-users/${encodeURIComponent(params.id)}`, { method: 'PATCH' });
}
