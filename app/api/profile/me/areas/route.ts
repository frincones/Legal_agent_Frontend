import { proxyToRailway } from '@/lib/api/proxy';

export async function PUT(req: Request) {
  return proxyToRailway(req, '/v1/profile/me/areas', { method: 'PUT' });
}
