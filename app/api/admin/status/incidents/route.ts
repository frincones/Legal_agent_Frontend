import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/admin/status/incidents${qs ? `?${qs}` : ''}`);
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/admin/status/incidents', { method: 'POST' });
}
