/**
 * Sprint C · proxy `/api/cloud/watchers`
 * GET → /v1/cloud/watchers (list)
 * POST → /v1/cloud/watchers (create)
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/cloud/watchers');
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/cloud/watchers');
}
