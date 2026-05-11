import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request, { params }: { params: { subject: string } }) {
  const url = new URL(req.url);
  return proxyToRailway(
    req,
    `/v1/audit/habeas-data/${encodeURIComponent(params.subject)}?${url.searchParams.toString()}`,
  );
}
