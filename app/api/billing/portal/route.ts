import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/billing/portal', { method: 'POST' });
}
