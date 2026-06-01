import { proxyToRailway } from '@/lib/api/proxy';
type Params = { params: { path: string[] } };
function p(parts: string[], req: Request): string {
  return `/v2/cookbooks/${parts.join('/')}${new URL(req.url).search}`;
}
export async function GET(req: Request, { params }: Params) {
  return proxyToRailway(req, p(params.path, req), { method: 'GET' });
}
export async function POST(req: Request, { params }: Params) {
  return proxyToRailway(req, p(params.path, req), { method: 'POST' });
}
