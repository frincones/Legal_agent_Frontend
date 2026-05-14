import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { matterId: string } }) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/judge-predictions/matter/${params.matterId}/history${qs ? `?${qs}` : ''}`);
}
