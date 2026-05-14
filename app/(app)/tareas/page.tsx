import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { TasksList } from '@/components/tasks/TasksList';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function TareasPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Tareas"
          title="Tareas del despacho"
          subtitle="Tareas asignadas · marca como hechas cuando avances"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-4xl">
            <TasksList showMatterColumn showAddButton />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
