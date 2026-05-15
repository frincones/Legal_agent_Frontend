/**
 * Sprint D · proxy `/api/docusign/envelopes/[id]`
 * GET → estado actual (con ?refresh=true opcional)
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(
    req,
    `/v1/docusign/envelopes/${params.id}${qs ? '?' + qs : ''}`
  );
}
