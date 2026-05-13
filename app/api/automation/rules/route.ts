import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/automation/rules');
}
export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/automation/rules', { method: 'POST' });
}
