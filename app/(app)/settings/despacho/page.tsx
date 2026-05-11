import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { createClient } from '@/lib/supabase/server';
import { fetchFirmInfo } from '@/lib/api/supabase-fetchers';
import { formatRelative } from '@/lib/utils';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { BillingPanel } from '@/components/settings/BillingPanel';

export const revalidate = 30;

type AuditRow = {
  id: number;
  ts: string;
  action: string;
  user_id: string | null;
  payload: Record<string, unknown>;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  cedula_profesional: string | null;
  role: string;
  mfa_enrolled: boolean;
  last_login_at: string | null;
};

export default async function SettingsDespacho() {
  const firm = await fetchFirmInfo();
  const supabase = createClient();
  const [usersRes, auditRes] = await Promise.all([
    supabase.from('users').select('id, email, full_name, cedula_profesional, role, mfa_enrolled, last_login_at').order('role'),
    supabase.from('audit_log').select('id, ts, action, user_id, payload').order('ts', { ascending: false }).limit(20),
  ]);
  const users = (usersRes.data ?? []) as UserRow[];
  const audit = (auditRes.data ?? []) as AuditRow[];

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Configuración / Despacho"
          title="Configuración del despacho"
          subtitle={firm ? `${firm.razon_social} · plan despacho · ${users.length} miembros` : 'Despacho'}
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto flex max-w-5xl flex-col gap-5">
            <SettingsTabs active="despacho" />

            <section>
              <h3 className="serif mb-2 text-[16px] font-semibold">Plan y facturación</h3>
              <BillingPanel />
            </section>

            <section className="surface p-[var(--pad-card)]">
              <h3 className="serif m-0 text-[16px] font-semibold">Miembros del despacho</h3>

              {/* Mobile · cards */}
              <div className="mt-3 flex flex-col divide-y divide-line md:hidden">
                {users.map((u) => (
                  <div key={u.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold">{u.full_name}</span>
                      <span className={`chip ml-auto text-[10.5px] ${u.role === 'admin' ? 'chip-purple' : ''}`}>{u.role}</span>
                    </div>
                    <div className="text-[12px] muted break-all">{u.email}</div>
                    <div className="mono text-[11px] muted">{u.cedula_profesional ?? '—'}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] muted">
                      {u.mfa_enrolled
                        ? <span className="chip chip-green text-[10.5px]"><span className="dot"/>MFA</span>
                        : <span className="chip chip-amber text-[10.5px]"><span className="dot"/>sin MFA</span>}
                      <span className="ml-auto">{u.last_login_at ? formatRelative(u.last_login_at) : 'nunca'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop · table */}
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider muted">
                      <th className="py-2">Nombre</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Tarjeta profesional</th>
                      <th className="py-2">Rol</th>
                      <th className="py-2">MFA</th>
                      <th className="py-2 text-right">Último login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-line text-[13px]">
                        <td className="py-2.5 font-semibold">{u.full_name}</td>
                        <td className="py-2.5 muted">{u.email}</td>
                        <td className="py-2.5 mono text-[11.5px]">{u.cedula_profesional ?? '—'}</td>
                        <td className="py-2.5">
                          <span className={`chip ${u.role === 'admin' ? 'chip-purple' : ''}`}>{u.role}</span>
                        </td>
                        <td className="py-2.5">
                          {u.mfa_enrolled
                            ? <span className="chip chip-green"><span className="dot"/>activa</span>
                            : <span className="chip chip-amber"><span className="dot"/>pendiente</span>}
                        </td>
                        <td className="py-2.5 text-right text-[11.5px] muted">
                          {u.last_login_at ? formatRelative(u.last_login_at) : 'nunca'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="surface p-[var(--pad-card)]">
              <div className="flex items-center justify-between">
                <h3 className="serif m-0 text-[16px] font-semibold">Audit log (últimas 20 acciones)</h3>
                <span className="chip chip-green">
                  <span className="inline-flex">{Ic.shield}</span>
                  Append-only · 12 meses retención
                </span>
              </div>
              <div className="mt-3 flex flex-col">
                {audit.length === 0 ? (
                  <div className="muted text-[12.5px]">Sin entradas en audit log.</div>
                ) : (
                  audit.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 border-b border-line py-2 text-[12px] last:border-0">
                      <span className="mono text-[11px] muted whitespace-nowrap">
                        {formatRelative(a.ts)}
                      </span>
                      <span className="chip chip-blue">{a.action}</span>
                      <pre className="mono flex-1 overflow-x-auto text-[10.5px] muted">
                        {JSON.stringify(a.payload).slice(0, 180)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
