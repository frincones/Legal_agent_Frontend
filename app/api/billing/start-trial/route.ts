import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/billing/start-trial', { method: 'POST' });
}
