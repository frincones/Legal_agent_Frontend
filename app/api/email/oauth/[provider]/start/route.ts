import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const url = new URL(req.url);
  return proxyToRailway(req, `/v1/email/oauth/${params.provider}/start?${url.searchParams.toString()}`);
}
