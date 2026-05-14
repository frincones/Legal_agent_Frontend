import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { MarketplaceBrowser } from '@/components/marketplace/MarketplaceBrowser';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Marketplace"
          title="Marketplace de plantillas"
          subtitle="Plantillas oficiales LexAI + aportes de la comunidad · Fork con 1 click"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <MarketplaceBrowser />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
