import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Sprint M20.12 · /api/firm/playbook/history → /v1/firm/playbook/history
 */
export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/firm/playbook/history');
}
