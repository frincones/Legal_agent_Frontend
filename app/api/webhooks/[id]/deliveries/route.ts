import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  return proxyToRailway(req, `/v1/webhooks/${params.id}/deliveries?${url.searchParams.toString()}`);
}
