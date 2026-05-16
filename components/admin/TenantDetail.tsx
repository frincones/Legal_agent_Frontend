'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pause, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChangePlanModal } from '@/components/saas/ChangePlanModal';

type TenantData = {
  firm: any;
  health: any;
  billing_overview: any;
  feature_overrides: any[];
  recent_audit: any[];
};

const TABS = ['Resumen', 'Usuarios', 'Feature flags', 'Auditoría'] as const;
type Tab = (typeof TABS)[number];

export function TenantDetail({ firmId }: { firmId: string }) {
  const [data, setData] = useState<TenantData | null>(null);
  const [tab, setTab] = useState<Tab>('Resumen');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);

  function load() {
    fetch(`/api/admin/tenants/${firmId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [firmId]);

  useEffect(() => {
    if (tab === 'Usuarios' && users.length === 0) {
      fetch(`/api/admin/tenants/${firmId}/users`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setUsers(d.items || []));
    }
  }, [tab, firmId, users.length]);

  async function suspend() {
    if (!confirm('¿Suspender esta firma? Pasará a status=paused.')) return;
    setSubmitting('suspend');
    try {
      const reason = prompt('Razón (opcional):') || '';
      const r = await fetch(`/api/admin/tenants/${firmId}/suspend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (r.ok) { toast.success('Firma suspendida'); load(); }
      else toast.error('No se pudo suspender');
    } finally { setSubmitting(null); }
  }
  async function reactivate() {
    setSubmitting('reactivate');
    try {
      const r = await fetch(`/api/admin/tenants/${firmId}/reactivate`, { method: 'POST' });
      if (r.ok) { toast.success('Firma reactivada'); load(); }
      else toast.error('No se pudo reactivar');
    } finally { setSubmitting(null); }
  }

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-6 text-[13px] muted">
        <Loader2 size={14} className="animate-spin" /> Cargando…
      </div>
    );
  }
  if (!data) {
    return <div className="surface p-6 text-center text-[13px] muted">No se encontró la firma.</div>;
  }

  const firm = data.firm;
  const health = data.health || {};
  const overview = data.billing_overview;

  return (
    <div className="flex flex-col gap-4">
      <header className="surface flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="serif text-[22px] font-semibold leading-tight">{firm.razon_social}</h1>
          <div className="mt-1 text-[11.5px] muted">
            {firm.country?.toUpperCase()} · NIT {firm.tax_id || '—'} · Plan {overview?.plan_code || 'free'} · Status {overview?.status || 'trialing'}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-md"
            onClick={() => setChangePlanOpen(true)}
            disabled={!!submitting}
            title="Cambiar plan de membresía"
          >
            <Sparkles size={14} /> Cambiar plan
          </button>
          {overview?.status !== 'paused' ? (
            <button className="btn btn-md" onClick={suspend} disabled={!!submitting}>
              <Pause size={14} /> Suspender
            </button>
          ) : (
            <button className="btn btn-primary btn-md" onClick={reactivate} disabled={!!submitting}>
              <Play size={14} /> Reactivar
            </button>
          )}
        </div>
      </header>

      <ChangePlanModal
        firmId={firmId}
        firmName={firm.razon_social}
        currentPlan={overview?.plan_code}
        currentStatus={overview?.status}
        hasPaddleSubscription={!!overview?.paddle_subscription_id}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        onChanged={() => load()}
      />

      <nav className="surface flex flex-wrap gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors',
              tab === t ? 'bg-accent text-on-accent' : 'text-ink-2 hover:bg-bg-sunken',
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Resumen' && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card title="Health">
            <Stat label="Usuarios" value={health.users_count || 0} />
            <Stat label="Casos totales" value={health.matters_total || 0} />
            <Stat label="Casos activos" value={health.matters_active || 0} />
            <Stat label="LLM calls MTD" value={health.llm_calls_mtd || 0} />
            <Stat label="Voz min MTD" value={health.voice_min_mtd || 0} />
            <Stat label="Tickets abiertos" value={health.open_tickets || 0} />
          </Card>
          <Card title="Billing">
            <Stat label="Plan" value={overview?.plan_name || '—'} />
            <Stat label="Status" value={overview?.status || '—'} />
            <Stat label="Periodo" value={
              overview?.current_period_end
                ? new Date(overview.current_period_end).toLocaleDateString('es-CO')
                : '—'
            } />
            <Stat label="Trial vence" value={
              overview?.trial_ends_at
                ? new Date(overview.trial_ends_at).toLocaleDateString('es-CO')
                : '—'
            } />
            <Stat label="Doc/mes" value={overview?.documents_mtd || 0} />
          </Card>
        </div>
      )}

      {tab === 'Usuarios' && (
        <div className="surface overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">MFA</th>
                <th className="px-3 py-2 text-left">Último login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-line/40">
                  <td className="px-3 py-2 font-mono text-[11px]">{u.email}</td>
                  <td className="px-3 py-2">{u.full_name || '—'}</td>
                  <td className="px-3 py-2"><span className="chip chip-neutral text-[10px]">{u.role}</span></td>
                  <td className="px-3 py-2">{u.mfa_enrolled ? '✓' : '—'}</td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-CO') : 'Nunca'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Feature flags' && (
        <div className="surface p-4">
          {(data.feature_overrides || []).length === 0 ? (
            <div className="text-center text-[13px] muted py-6">Esta firma no tiene overrides.</div>
          ) : (
            <ul className="grid gap-2">
              {(data.feature_overrides || []).map((f: any) => (
                <li key={f.flag_key} className="rounded-md border border-line p-3 text-[12.5px]">
                  <div className="flex items-center gap-2">
                    <span className={cn('chip text-[10px]', f.enabled ? 'chip-ok' : 'chip-bad')}>
                      {f.enabled ? 'ON' : 'OFF'}
                    </span>
                    <strong>{f.flag_key}</strong>
                    <span className="text-[10.5px] muted">{f.category}</span>
                  </div>
                  {f.reason && <div className="mt-1 text-[11px] muted">{f.reason}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'Auditoría' && (
        <div className="surface p-3">
          {(data.recent_audit || []).length === 0 ? (
            <div className="text-center text-[13px] muted py-6">Sin actividad reciente.</div>
          ) : (
            <ul className="grid gap-1.5">
              {data.recent_audit.map((a: any) => (
                <li key={a.occurred_at + a.action} className="flex items-center gap-2 text-[11.5px]">
                  <span className="font-mono text-[10.5px] text-ink-3">
                    {new Date(a.occurred_at).toLocaleString('es-CO')}
                  </span>
                  <span className="font-medium">{a.action}</span>
                  {a.resource_type && <span className="muted">→ {a.resource_type}</span>}
                  <span className={cn('chip text-[9px] ml-auto', a.outcome === 'success' ? 'chip-ok' : 'chip-bad')}>
                    {a.outcome}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-4">
      <h3 className="serif mb-2 text-[15px] font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border border-line/40 px-3 py-2">
      <div className="text-[10.5px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-0.5 font-mono text-[14px]">{String(value)}</div>
    </div>
  );
}
