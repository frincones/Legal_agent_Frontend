import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { matterDocumentId: string } }) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/evidence/inconsistencies/document/${params.matterDocumentId}/history${qs ? `?${qs}` : ''}`);
}
