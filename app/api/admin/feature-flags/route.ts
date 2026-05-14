import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/admin/feature-flags');
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/admin/feature-flags', { method: 'POST' });
}
