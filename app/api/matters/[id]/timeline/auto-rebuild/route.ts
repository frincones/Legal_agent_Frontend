import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(
    req,
    `/v1/matters/${encodeURIComponent(params.id)}/timeline/auto-rebuild`,
    { method: 'POST' },
  );
}
