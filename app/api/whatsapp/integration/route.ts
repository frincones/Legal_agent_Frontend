import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/whatsapp/integration');
}

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/whatsapp/integration', { method: 'POST' });
}

export async function DELETE(req: Request) {
  return proxyToRailway(req, '/v1/whatsapp/integration', { method: 'DELETE' });
}
