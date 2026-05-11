import { proxyToRailway } from '@/lib/api/proxy';

export async function PATCH(
  req: Request,
  { params }: { params: { kind: string; id: string } },
) {
  return proxyToRailway(req, `/v1/inbox/${params.kind}/${params.id}`, { method: 'PATCH' });
}
