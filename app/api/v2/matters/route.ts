import { proxyToRailway } from '@/lib/api/proxy';

/** /api/v2/matters → Railway /v2/matters (lista + crea). */

export async function GET(req: Request) {
  const search = new URL(req.url).search;
  return proxyToRailway(req, `/v2/matters${search}`, { method: 'GET' });
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v2/matters', { method: 'POST' });
}
