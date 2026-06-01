import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Catch-all proxy para /api/v2/matters/{matter_id}/[...] → Railway /v2/matters/{matter_id}/[...]
 *
 * Covers: GET /{id}, PATCH /{id}, POST /{id}/archive, GET /{id}/history.
 */

type Params = { params: { path: string[] } };

function buildPath(parts: string[], req: Request): string {
  const search = new URL(req.url).search;
  return `/v2/matters/${parts.join('/')}${search}`;
}

export async function GET(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'GET' });
}
export async function POST(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'POST' });
}
export async function PATCH(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'PATCH' });
}
export async function DELETE(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'DELETE' });
}
