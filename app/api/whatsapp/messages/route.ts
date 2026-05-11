import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  return proxyToRailway(req, `/v1/whatsapp/messages?${url.searchParams.toString()}`);
}
