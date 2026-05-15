import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(req: Request) {
  return proxyToRailway(req, '/v1/me/onboarding/demo-data', { method: 'DELETE' });
}
