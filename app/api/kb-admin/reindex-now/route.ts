import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(
    req,
    `/v1/kb-admin/reindex-now${qs ? `?${qs}` : ''}`,
    { method: 'POST' },
  );
}
