import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  return proxyToRailway(req, `/v1/trust/transactions?${url.searchParams.toString()}`);
}
export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/trust/transactions', { method: 'POST' });
}
