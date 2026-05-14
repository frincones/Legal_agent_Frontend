import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { JudgesBrowser } from '@/components/judges/JudgesBrowser';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function JuecesPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Jueces"
          title="Magistrados y jueces"
          subtitle="Perfiles + decisiones recientes + simulador de recepción IA"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <JudgesBrowser />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
