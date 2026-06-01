import { proxyToRailway } from '@/lib/api/proxy';
export async function GET(req: Request) {
  return proxyToRailway(req, `/v2/connectors${new URL(req.url).search}`, { method: 'GET' });
}
