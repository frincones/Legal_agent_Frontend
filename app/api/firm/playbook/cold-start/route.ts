import { proxyToRailway } from '@/lib/api/proxy';

/**
 * Sprint M20.11 · Proxy /api/firm/playbook/cold-start → /v1/firm/playbook/cold-start
 *
 * Genera un playbook inicial vía LLM a partir de inputs del usuario en el
 * onboarding o desde la pantalla /settings/playbook.
 */
export async function POST(req: Request) {
  return proxyToRailway(req, '/v1/firm/playbook/cold-start');
}
