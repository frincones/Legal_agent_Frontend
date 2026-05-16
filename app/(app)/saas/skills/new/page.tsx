import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SkillEditor } from '@/components/saas/SkillEditor';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function NewSkillPage() {
  const p = await getSessionPrincipal();
  if (!p) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas/skills">Skills</Link> · <span className="text-accent">Nueva</span></>}
          title="Crear skill builtin"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <SkillEditor skillId="new" />
        </div>
      </main>
    </AppShell>
  );
}
