import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return proxyToRailway(req, `/v1/imports/${params.id}`);
}
