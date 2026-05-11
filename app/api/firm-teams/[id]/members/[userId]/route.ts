import { proxyToRailway } from '@/lib/api/proxy';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } },
) {
  return proxyToRailway(
    req,
    `/v1/firm-teams/${encodeURIComponent(params.id)}/members/${encodeURIComponent(params.userId)}`,
    { method: 'DELETE' },
  );
}
