import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SaasSkillsMetricsView } from '@/components/saas/SaasSkillsMetricsView';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SkillsMetricsPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas/skills">Skills</Link> · <span className="text-accent">Métricas</span></>}
          title="Métricas de skills"
          subtitle="Uso por skill y por firma · tokens + costo + errores"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <SaasSkillsMetricsView />
        </div>
      </main>
    </AppShell>
  );
}
