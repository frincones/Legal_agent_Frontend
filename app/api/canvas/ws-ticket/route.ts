/**
 * Sprint J · proxy /api/canvas/ws-ticket → POST /v1/canvas/ws-ticket
 * Emite un ticket HMAC corto (60s) que el cliente usa para abrir el WS
 * colaborativo. Reutiliza proxyToRailway con auth Supabase.
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/canvas/ws-ticket', { method: 'POST' });
}
