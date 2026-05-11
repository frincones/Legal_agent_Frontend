import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/legal-alerts/unread-count', { method: 'GET' });
}
