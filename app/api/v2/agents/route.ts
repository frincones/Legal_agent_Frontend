import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const s = new URL(req.url).search;
  return proxyToRailway(req, `/v2/agents${s}`, { method: 'GET' });
}
