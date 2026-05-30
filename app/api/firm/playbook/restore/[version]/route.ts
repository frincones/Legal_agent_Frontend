import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Sprint M20.12 · /api/firm/playbook/restore/{version}
 */
export async function POST(req: Request, ctx: { params: Promise<{ version: string }> }) {
  const { version } = await ctx.params;
  return proxyToRailway(req, `/v1/firm/playbook/restore/${version}`);
}
