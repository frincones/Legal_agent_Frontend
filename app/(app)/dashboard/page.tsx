import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { DashboardTabs } from '@/components/dashboards/DashboardTabs';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function DashboardEjecutivoPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  const allowed = ['admin', 'socio_senior', 'socio_junior'];
  if (!principal.role || !allowed.includes(principal.role)) {
    redirect('/');
  }
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Dashboard ejecutivo"
          title="Dashboard ejecutivo"
          subtitle="Revenue · Performance · Pipeline · Accuracy IA · Reports guardados"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <DashboardTabs />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
