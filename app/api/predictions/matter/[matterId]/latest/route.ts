import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { matterId: string } }) {
  return proxyToRailway(req, `/v1/predictions/matter/${params.matterId}/latest`);
}
