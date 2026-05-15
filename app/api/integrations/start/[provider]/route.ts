/**
 * Sprint A · proxy `/api/integrations/start/[provider]`
 * POST → /v1/integrations/{provider}/start (genera state + auth_url)
 *
 * Nota: este path es /start/[provider] (no /[provider]/start) para
 * evitar conflicto Next.js con [id] al mismo nivel.
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(
  req: Request,
  { params }: { params: { provider: string } }
) {
  return proxyToRailway(req, `/v1/integrations/${params.provider}/start`);
}
