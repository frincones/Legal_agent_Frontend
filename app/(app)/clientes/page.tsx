import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { ClientesTopActions } from '@/components/clientes/ClientesActions';
import { fetchClients } from '@/lib/api/rsc-fetchers';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 30;

export default async function ClientesPage() {
  const clients = await fetchClients();
  const supabase = createClient();

  // Count active matters per client
  const matterCounts: Record<string, number> = {};
  if (clients.length > 0) {
    const { data } = await supabase
      .from('matters')
      .select('client_id')
      .neq('status', 'archivado')
      .in('client_id', clients.map((c) => c.id));
    for (const r of data ?? []) {
      const key = (r as { client_id: string }).client_id;
      matterCounts[key] = (matterCounts[key] ?? 0) + 1;
    }
  }

  const conConsentimiento = clients.filter((c) => c.consent_lfpdppp_at).length;

  return (
    <AppShell active="clientes">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Clientes"
          title="Clientes activos"
          subtitle={
            <>
              {clients.length} clientes · {Object.keys(matterCounts).length} con caso abierto · {conConsentimiento} con Habeas Data al día
            </>
          }
          actions={<ClientesTopActions />}
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {clients.length === 0 ? (
            <div className="surface p-12 text-center muted">No hay clientes registrados aún.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((c) => {
                const initials = c.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('');
                const idLabel = c.tax_id ?? c.personal_id ?? '';
                const casos = matterCounts[c.id] ?? 0;
                return (
                  <Link
                    key={c.id}
                    href={`/clientes/${c.id}`}
                    className="surface block p-[var(--pad-card)] transition hover:shadow-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-[48px] w-[48px] flex-none place-items-center rounded-full text-[16px] font-semibold text-white"
                        style={{
                          background: 'linear-gradient(135deg, rgb(var(--accent-rgb)), rgb(var(--purple-rgb)))',
                        }}
                      >
                        {initials.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold">{c.nombre}</div>
                        <div className="text-[11.5px] muted">
                          {c.tipo === 'persona_juridica' ? 'Persona jurídica' : 'Persona natural'} · {idLabel}
                        </div>
                      </div>
                      {c.vip && <span className="chip chip-blue">VIP</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[12px] muted">
                      <span className={`chip ${casos > 0 ? 'chip-green' : ''}`}>
                        <span className="dot" />
                        {casos} caso{casos !== 1 ? 's' : ''}
                      </span>
                      {c.consent_voice_recording && <span className="chip chip-blue">voz autorizada</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
