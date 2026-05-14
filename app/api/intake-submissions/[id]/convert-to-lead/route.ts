import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/intake-submissions/${params.id}/convert-to-lead`, { method: 'POST' });
}
