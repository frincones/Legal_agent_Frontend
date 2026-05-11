import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { ReportsDashboard } from '@/components/reportes/ReportsDashboard';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Reportes"
          title="Reportes y analíticas"
          subtitle="KPIs del despacho · performance por abogado · series temporales"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <ReportsDashboard />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
