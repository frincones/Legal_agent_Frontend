import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { clientId: string } }) {
  const url = new URL(req.url);
  return proxyToRailway(req, `/v1/whatsapp/messages/by-client/${params.clientId}?${url.searchParams.toString()}`);
}
