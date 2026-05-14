import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v2/reports/${params.id}/run`, { method: 'POST' });
}
