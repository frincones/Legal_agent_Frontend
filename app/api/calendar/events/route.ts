import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  return proxyToRailway(req, `/v1/calendar/events?${url.searchParams.toString()}`);
}

/**
 * Sprint B · POST /api/calendar/events
 * Crea audiencia desde LexAI · push a Google/Outlook Calendar.
 */
export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/calendar/events');
}
