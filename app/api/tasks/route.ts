import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/tasks${qs ? `?${qs}` : ''}`);
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/tasks', { method: 'POST' });
}
