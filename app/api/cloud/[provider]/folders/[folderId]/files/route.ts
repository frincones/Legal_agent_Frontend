/**
 * Sprint C · proxy `/api/cloud/[provider]/folders/[folderId]/files`
 * GET → /v1/cloud/{provider}/folders/{id}/files
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(
  req: Request,
  { params }: { params: { provider: string; folderId: string } }
) {
  return proxyToRailway(
    req,
    `/v1/cloud/${params.provider}/folders/${encodeURIComponent(params.folderId)}/files`
  );
}
