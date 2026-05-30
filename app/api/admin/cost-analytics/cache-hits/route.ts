import { proxyToRailway } from '@/lib/api/proxy';
export async function GET(req: Request) { return proxyToRailway(req, '/v1/admin/cost-analytics/cache-hits'); }
