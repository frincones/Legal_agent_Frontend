import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { KBBrowser } from '@/components/kb/KBBrowser';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function KBPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Conocimiento"
          title="Knowledge Base · Memoria del despacho"
          subtitle="Precedentes, estrategias, lecciones aprendidas · búsqueda semántica"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <KBBrowser />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
