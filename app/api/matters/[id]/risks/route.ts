import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : '';
  return proxyToRailway(
    req,
    `/v1/matters/${encodeURIComponent(params.id)}/risks${qs}`,
    { method: 'GET' },
  );
}
