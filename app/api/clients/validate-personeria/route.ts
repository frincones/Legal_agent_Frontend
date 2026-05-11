import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : '';
  return proxyToRailway(req, `/v1/clients/validate-personeria${qs}`, { method: 'GET' });
}
