import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/judges/${params.id}/decisions${qs ? `?${qs}` : ''}`);
}
