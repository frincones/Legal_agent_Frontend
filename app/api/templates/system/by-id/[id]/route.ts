import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Proxy GET /api/templates/system/by-id/[id] → backend
 *   GET /v1/templates/system/by-id/[id]
 *
 * Returns one template's full content_md + metadata. Works for both
 * system (firm_id IS NULL) and firm-owned rows the caller can see.
 */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/templates/system/by-id/${ctx.params.id}`);
}
