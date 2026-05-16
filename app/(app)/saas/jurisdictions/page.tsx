import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { JurisdictionsView } from '@/components/saas/JurisdictionsView';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function JurisdictionsPage() {
  const p = await getSessionPrincipal();
  if (!p) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Jurisdicciones</span></>}
          title="Jurisdicciones disponibles"
          subtitle="Países que las skills pueden usar como contexto · activación expansión LATAM"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <JurisdictionsView />
        </div>
      </main>
    </AppShell>
  );
}
