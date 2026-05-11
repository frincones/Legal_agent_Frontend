import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/profile/me', { method: 'GET' });
}

export async function PATCH(req: Request) {
  return proxyToRailway(req, '/v1/profile/me', { method: 'PATCH' });
}
