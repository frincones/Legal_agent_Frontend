import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { matterDocumentId: string } }) {
  return proxyToRailway(req, `/v1/evidence/inconsistencies/document/${params.matterDocumentId}/latest`);
}
