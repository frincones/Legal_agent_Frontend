import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Catch-all proxy para /api/v2/onboarding/* → Railway /v2/onboarding/*
 *
 * Sprint M21.S2. No requiere ningun route handler especifico — el catch-all
 * mapea cualquier sub-path (cold-start/start, cold-start/{id}/finish,
 * seed-docs/upload, company-profile, practice-areas, etc.) y reenvia.
 */

type Params = { params: { path: string[] } };

function buildPath(parts: string[], req: Request): string {
  const search = new URL(req.url).search;
  return `/v2/onboarding/${parts.join('/')}${search}`;
}

export async function GET(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'GET' });
}
export async function POST(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'POST' });
}
export async function DELETE(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'DELETE' });
}
export async function PATCH(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'PATCH' });
}
