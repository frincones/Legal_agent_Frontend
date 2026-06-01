import { proxyToRailway } from '@/lib/api/proxy';

type Params = { params: { path: string[] } };

function buildPath(parts: string[], req: Request): string {
  const search = new URL(req.url).search;
  return `/v2/agents/${parts.join('/')}${search}`;
}

export async function GET(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'GET' });
}
export async function POST(req: Request, { params }: Params) {
  return proxyToRailway(req, buildPath(params.path, req), { method: 'POST' });
}
