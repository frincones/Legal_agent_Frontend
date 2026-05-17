import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Proxy POST /api/templates/search → backend POST /v1/templates/search.
 * Body and response are JSON; auth via Supabase session.
 */
export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/templates/search');
}
