import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/trust/accounts');
}
export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/trust/accounts', { method: 'POST' });
}
