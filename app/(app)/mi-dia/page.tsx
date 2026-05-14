import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { MyDayDashboard } from '@/components/my-day/MyDayDashboard';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function MiDiaPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Mi día"
          title="Mi día"
          subtitle="Lo que necesitas atender hoy · tareas, plazos, menciones y predicciones"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-5xl">
            <MyDayDashboard />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
