import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { RedlinePoliciesView } from '@/components/saas/RedlinePoliciesView';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function RedlinePoliciesPage() {
  const p = await getSessionPrincipal();
  if (!p) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Redline Policies</span></>}
          title="Políticas globales de redline"
          subtitle="Forbidden terms y required clauses que TODAS las firmas heredan por defecto"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <RedlinePoliciesView />
        </div>
      </main>
    </AppShell>
  );
}
