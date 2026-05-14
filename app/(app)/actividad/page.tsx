import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { ActivityFeed } from '@/components/collab/ActivityFeed';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function ActividadPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Actividad"
          title="Actividad del despacho"
          subtitle="Lo que pasó hoy · comentarios, documentos, lecciones, firmas y plazos"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-4xl">
            <ActivityFeed limit={120} />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
