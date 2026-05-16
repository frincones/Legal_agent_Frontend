'use client';

/**
 * Sprint F · ChangePlanModal
 *
 * Cambia el plan de membresía de un tenant desde panel SaaS admin.
 *
 * Features:
 *   - Plan actual mostrado (read-only)
 *   - Selector de los 5 planes (free, starter, pro, firm, enterprise)
 *   - Status (active/trialing/paused)
 *   - Billing period (monthly/annual)
 *   - Extender trial N días (opcional)
 *   - Reason obligatorio (min 5 chars · audit)
 *   - Detecta downgrade → warning
 *   - Detecta Paddle activo → warning sincronización
 *   - Submit con loading + toast + post-action callback
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Sparkles, AlertCircle, CreditCard, Loader2, X, Check, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type PlanRow = {
  code: string;
  name: string;
  monthly_cop: number;
  annual_cop: number;
  q_users: number | null;
  q_matters: number | null;
  q_documents_mo: number | null;
  q_llm_calls_mo: number | null;
  q_voice_min_mo: number | null;
  paddle_price_id: string | null;
};

type ChangePlanResponse = {
  ok: boolean;
  firm_id: string;
  old_plan: string;
  new_plan: string;
  paddle_sync_status: string;
  email_sent: boolean;
  audit_logged: boolean;
};

const PLAN_RANK: Record<string, number> = {
  free: 0, starter: 1, pro: 2, firm: 3, enterprise: 4,
};

function formatCop(n: number): string {
  if (!n) return '$0 COP';
  return '$' + n.toLocaleString('es-CO') + ' COP';
}

export function ChangePlanModal({
  firmId,
  firmName,
  currentPlan,
  currentStatus,
  hasPaddleSubscription,
  open,
  onOpenChange,
  onChanged,
}: {
  firmId: string;
  firmName?: string;
  currentPlan?: string;
  currentStatus?: string;
  hasPaddleSubscription?: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged?: (result: ChangePlanResponse) => void;
}) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newPlan, setNewPlan] = useState<string>(currentPlan || 'free');
  const [status, setStatus] = useState<string>(currentStatus || 'active');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [extendTrialDays, setExtendTrialDays] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch('/api/saas/subscription-plans', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        const list = Array.isArray(data) ? data : [];
        setPlans(list);
        if (list.length === 0) {
          setLoadError('No se recibió ningún plan · revisa que seas admin SaaS');
        }
      } else {
        const body = await r.json().catch(() => ({}));
        setLoadError(
          (typeof body?.detail === 'string' ? body.detail : null) ||
          `Error ${r.status} · ¿eres admin SaaS?`
        );
      }
    } catch (e: any) {
      setLoadError(e?.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadPlans();
      setNewPlan(currentPlan || 'free');
      setStatus(currentStatus || 'active');
      setReason('');
      setExtendTrialDays(0);
    }
  }, [open, currentPlan, currentStatus, loadPlans]);

  const currentPlanRow = useMemo(
    () => plans.find(p => p.code === currentPlan),
    [plans, currentPlan]
  );
  const newPlanRow = useMemo(
    () => plans.find(p => p.code === newPlan),
    [plans, newPlan]
  );

  const isDowngrade = useMemo(() => {
    if (!currentPlan || !newPlan) return false;
    const a = PLAN_RANK[newPlan] ?? -1;
    const b = PLAN_RANK[currentPlan] ?? -1;
    return a < b;
  }, [currentPlan, newPlan]);

  const isSamePlan = currentPlan === newPlan;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSamePlan) {
      toast.error('Selecciona un plan diferente al actual');
      return;
    }
    const r = reason.trim();
    if (r.length < 5) {
      toast.error('La razón debe tener al menos 5 caracteres (audit)');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(`/api/saas/tenants/${firmId}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_code: newPlan,
          status,
          billing_period: billingPeriod,
          extend_trial_days: extendTrialDays,
          reason: r,
          sync_paddle: true,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        const msg = body?.detail?.message || body?.detail || `Error ${resp.status}`;
        toast.error(typeof msg === 'string' ? msg : 'No pude cambiar el plan');
        return;
      }
      const data: ChangePlanResponse = await resp.json();

      const pieces = [`Plan: ${data.old_plan} → ${data.new_plan}`];
      if (data.paddle_sync_status === 'synced') pieces.push('Paddle sincronizado · cobro reiniciado');
      else if (data.paddle_sync_status.startsWith('error')) pieces.push('⚠️ Paddle: revisar manualmente');
      if (data.email_sent) pieces.push('email enviado');
      toast.success(pieces.join(' · '));

      onChanged?.(data);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 surface p-6 max-h-[90vh] overflow-auto">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="serif text-[18px] font-semibold">
                Cambiar plan de membresía
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12.5px] muted">
                {firmName ? `Firma: ${firmName}` : `Firm ID: ${firmId}`}
              </Dialog.Description>
            </div>
            <Dialog.Close className="btn btn-sm">
              <X size={14} />
            </Dialog.Close>
          </div>

          {loading ? (
            <div className="p-4 flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" /> Cargando planes…
            </div>
          ) : loadError ? (
            <div className="p-4 surface bg-danger-soft/30 text-[12.5px]">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="flex-none mt-0.5 text-danger" />
                <div>
                  <strong>No se pudieron cargar los planes.</strong>
                  <p className="mt-1 text-ink-2">{loadError}</p>
                  <p className="mt-2 text-[11px] muted">
                    Verifica que estés logueado como admin SaaS. Si el problema persiste,
                    espera 1-2 min y reabre el modal · podría ser propagación del deploy.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4">
              {/* Plan actual + nuevo side-by-side */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="surface p-3">
                  <div className="text-[10.5px] muted uppercase tracking-wide">Plan actual</div>
                  <div className="serif text-[16px] font-semibold mt-0.5">
                    {currentPlanRow?.name || currentPlan || '—'}
                  </div>
                  {currentPlanRow && (
                    <div className="text-[11.5px] muted mt-1">
                      {formatCop(currentPlanRow.monthly_cop)} / mes
                    </div>
                  )}
                </div>
                <ArrowRight size={16} className="text-ink-3" />
                <div className="surface p-3 bg-accent-soft/30 border-accent">
                  <div className="text-[10.5px] muted uppercase tracking-wide">Plan nuevo</div>
                  <div className="serif text-[16px] font-semibold mt-0.5 text-accent">
                    {newPlanRow?.name || newPlan}
                  </div>
                  {newPlanRow && (
                    <div className="text-[11.5px] muted mt-1">
                      {formatCop(newPlanRow.monthly_cop)} / mes
                      {newPlanRow.annual_cop > 0 && (
                        <> · {formatCop(newPlanRow.annual_cop)} / año</>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Plan selector */}
              <div>
                <label className="text-[12px] font-medium">Plan</label>
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {plans.map(p => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => setNewPlan(p.code)}
                      className={`surface p-2 text-center transition ${
                        newPlan === p.code
                          ? 'border-accent bg-accent-soft/30'
                          : 'hover:bg-bg-2'
                      }`}
                    >
                      <div className="serif text-[12.5px] font-semibold">{p.name}</div>
                      <div className="text-[10.5px] muted mt-0.5">
                        {p.monthly_cop === 0 ? 'Gratis' : formatCop(p.monthly_cop)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparativa de cuotas */}
              {currentPlanRow && newPlanRow && !isSamePlan && (
                <div className="surface p-3 text-[11.5px]">
                  <div className="font-medium mb-1.5">Comparativa de cuotas</div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-ink-3">
                        <th className="text-left font-normal">Recurso</th>
                        <th className="text-right font-normal">{currentPlanRow.name}</th>
                        <th></th>
                        <th className="text-right font-normal">{newPlanRow.name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <QuotaRow label="Usuarios" a={currentPlanRow.q_users} b={newPlanRow.q_users} />
                      <QuotaRow label="Casos" a={currentPlanRow.q_matters} b={newPlanRow.q_matters} />
                      <QuotaRow label="Documentos/mes" a={currentPlanRow.q_documents_mo} b={newPlanRow.q_documents_mo} />
                      <QuotaRow label="LLM calls/mes" a={currentPlanRow.q_llm_calls_mo} b={newPlanRow.q_llm_calls_mo} />
                      <QuotaRow label="Voice min/mes" a={currentPlanRow.q_voice_min_mo} b={newPlanRow.q_voice_min_mo} />
                    </tbody>
                  </table>
                </div>
              )}

              {/* Warnings */}
              {isDowngrade && (
                <div className="surface bg-warn-soft/40 border-l-4 border-l-warn p-3 text-[12px]">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="flex-none mt-0.5 text-warn" />
                    <div>
                      <strong>Downgrade detectado.</strong>
                      <p className="mt-1 text-ink-2">
                        El despacho podría tener uso actual que excede las cuotas del nuevo plan
                        (ej. más usuarios o más documentos). Los datos NO se eliminan, pero las
                        cuotas bloquearán nuevos requests si están al límite.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasPaddleSubscription && !isSamePlan && (
                <div className="surface bg-accent-soft/30 border-l-4 border-l-accent p-3 text-[12px]">
                  <div className="flex items-start gap-2">
                    <CreditCard size={14} className="flex-none mt-0.5 text-accent" />
                    <div>
                      <strong>Sincronización Paddle.</strong>
                      <p className="mt-1 text-ink-2">
                        La firma tiene suscripción Paddle activa. Al cambiar el plan:
                      </p>
                      <ul className="mt-1 list-disc list-inside text-ink-2">
                        <li>Se cobrará el costo COMPLETO del nuevo plan inmediatamente</li>
                        <li>El ciclo de facturación se reinicia desde hoy</li>
                        <li>Próximo cobro: dentro de 1 mes (o ciclo anual)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Status + billing period + trial extension */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[12px] font-medium">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="input mt-1 w-full"
                  >
                    <option value="active">Activo</option>
                    <option value="trialing">Trial</option>
                    <option value="past_due">Past Due</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium">Período</label>
                  <select
                    value={billingPeriod}
                    onChange={e => setBillingPeriod(e.target.value as any)}
                    className="input mt-1 w-full"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium">Trial +días</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={extendTrialDays}
                    onChange={e => setExtendTrialDays(parseInt(e.target.value) || 0)}
                    className="input mt-1 w-full"
                  />
                </div>
              </div>

              {/* Reason · obligatorio */}
              <div>
                <label className="text-[12px] font-medium">
                  Razón del cambio <span className="text-danger">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  required
                  minLength={5}
                  className="input mt-1 w-full resize-none"
                  placeholder="Ej: Cliente firmó acuerdo enterprise · Descuento por anualidad · Compensación por incidente del 15 nov…"
                />
                <p className="mt-1 text-[10.5px] muted">
                  Mínimo 5 caracteres · queda registrado en audit_logs
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <Dialog.Close className="btn flex-1" type="button">
                  Cancelar
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting || isSamePlan || reason.trim().length < 5}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Cambiando…</>
                  ) : (
                    <><Sparkles size={14} /> Confirmar cambio</>
                  )}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function QuotaRow({ label, a, b }: { label: string; a: number | null; b: number | null }) {
  const aStr = a === null || a === 0 ? '∞' : a.toLocaleString();
  const bStr = b === null || b === 0 ? '∞' : b.toLocaleString();
  const diff = a !== null && b !== null && a !== 0 && b !== 0 ? (b > a ? '↑' : b < a ? '↓' : '=') : '';
  const color = diff === '↑' ? 'text-ok' : diff === '↓' ? 'text-warn' : '';
  return (
    <tr className="border-t">
      <td className="py-1">{label}</td>
      <td className="py-1 text-right text-ink-2">{aStr}</td>
      <td className={`py-1 text-center ${color}`}>{diff}</td>
      <td className="py-1 text-right font-medium">{bStr}</td>
    </tr>
  );
}
