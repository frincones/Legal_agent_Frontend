import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { kind: string } }) {
  return proxyToRailway(req, `/v1/imports/fields/${params.kind}`);
}
