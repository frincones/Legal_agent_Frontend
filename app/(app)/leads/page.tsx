import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { LeadsBoard } from '@/components/leads/LeadsBoard';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Pipeline"
          title="Leads · Pipeline"
          subtitle="Captura prospectos · arrastra entre etapas · convierte en cliente"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <LeadsBoard />
        </div>
      </main>
    </AppShell>
  );
}
