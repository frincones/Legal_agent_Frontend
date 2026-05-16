import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SaasHooksList } from '@/components/saas/SaasHooksList';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SaasHooksPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Hooks</span></>}
          title="Hooks legales · linters + validators"
          subtitle="Habilita/deshabilita validadores pre/post skill · Block bloquea · Warn advierte · Log registra."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <SaasHooksList />
        </div>
      </main>
    </AppShell>
  );
}
