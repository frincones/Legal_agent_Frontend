import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { MentionsInbox } from '@/components/collab/MentionsInbox';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function MencionesPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Menciones"
          title="Te mencionaron"
          subtitle="Comentarios donde apareces · marca como leídas cuando atiendas"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-3xl">
            <MentionsInbox initialFilter="unread" />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
