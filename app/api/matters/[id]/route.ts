import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/matters/${encodeURIComponent(params.id)}`, { method: 'GET' });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/matters/${encodeURIComponent(params.id)}`, { method: 'PATCH' });
}
