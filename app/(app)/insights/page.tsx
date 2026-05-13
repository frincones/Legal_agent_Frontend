import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { InsightsList } from '@/components/insights/InsightsList';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Insights"
          title="Sugerencias proactivas"
          subtitle="LexAI analiza tu firma y propone acciones · acepta o descarta"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-4xl">
            <InsightsList />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
