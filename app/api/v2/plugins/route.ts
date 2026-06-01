import { proxyToRailway } from '@/lib/api/proxy';
export async function GET(req: Request) {
  return proxyToRailway(req, `/v2/plugins${new URL(req.url).search}`, { method: 'GET' });
}
