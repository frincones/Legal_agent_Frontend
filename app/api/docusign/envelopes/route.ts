/**
 * Sprint D · proxy `/api/docusign/envelopes`
 * GET → list, POST → create
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  return proxyToRailway(req, `/v1/docusign/envelopes${qs ? '?' + qs : ''}`);
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/docusign/envelopes');
}
