/**
 * Sprint F · proxy `/api/saas/tenants/[id]/change-plan`
 * POST → /v1/billing/admin/firms/{id}/set-plan
 *
 * Body:
 *   { plan_code, status, billing_period, extend_trial_days, reason, sync_paddle }
 *
 * Backend gating: require_saas_admin · audit + Paddle sync + email auto.
 */
import { proxyToRailway } from '@/lib/api/proxy';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return proxyToRailway(req, `/v1/billing/admin/firms/${params.id}/set-plan`);
}
