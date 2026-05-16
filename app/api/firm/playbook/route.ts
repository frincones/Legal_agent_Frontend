import { proxyToRailway } from '@/lib/api/proxy';
export async function GET(req: Request) { return proxyToRailway(req, '/v1/firm/playbook'); }
export async function PUT(req: Request) { return proxyToRailway(req, '/v1/firm/playbook'); }
