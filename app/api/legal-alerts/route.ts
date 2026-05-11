import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : '';
  return proxyToRailway(req, `/v1/legal-alerts/${qs}`, { method: 'GET' });
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/legal-alerts/', { method: 'POST' });
}
