import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SaasSkillsList } from '@/components/saas/SaasSkillsList';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SaasSkillsPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Skills</span></>}
          title="Skills builtin · catálogo global"
          subtitle="Gestiona skills (drafting + review) para todas las firmas."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <SaasSkillsList />
        </div>
      </main>
    </AppShell>
  );
}
