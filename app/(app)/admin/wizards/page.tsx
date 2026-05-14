import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { WizardsAdminPanel } from '@/components/wizards/WizardsAdminPanel';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function WizardsAdminPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  const allowed = ['admin', 'socio_senior', 'socio_junior',
                   'in_house', 'independiente', 'consultor'];
  if (!principal.role || !allowed.includes(principal.role)) {
    redirect('/inicio?denied=wizards-admin');
  }
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Admin · Wizards públicos"
          title="Wizards públicos (Portal B2C)"
          subtitle="Plantillas para que ciudadanos generen trámites · pensión, tutela, derecho de petición"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-5xl">
            <WizardsAdminPanel />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
