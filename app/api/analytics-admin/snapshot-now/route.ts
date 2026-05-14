import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request) {
  return proxyToRailway(req, '/v2/analytics-admin/snapshot-now', { method: 'POST' });
}
