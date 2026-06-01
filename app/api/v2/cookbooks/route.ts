import { proxyToRailway } from '@/lib/api/proxy';
export async function GET(req: Request) {
  return proxyToRailway(req, `/v2/cookbooks${new URL(req.url).search}`, { method: 'GET' });
}
