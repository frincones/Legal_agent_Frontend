import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { PlaybookTemplatesView } from '@/components/saas/PlaybookTemplatesView';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function PlaybookTemplatesPage() {
  const p = await getSessionPrincipal();
  if (!p) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Playbook Templates</span></>}
          title="Plantillas de playbook"
          subtitle="Plantillas que firmas pueden adoptar como base de su CLAUDE.md"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <PlaybookTemplatesView />
        </div>
      </main>
    </AppShell>
  );
}
