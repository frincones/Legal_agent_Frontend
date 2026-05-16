/**
 * Sprint F · proxy `/api/saas/subscription-plans`
 * GET → /v1/billing/admin/subscription-plans
 * Devuelve catálogo planes para el dropdown del modal admin.
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function GET(req: Request) {
  return proxyToRailway(req, '/v1/billing/admin/subscription-plans');
}
