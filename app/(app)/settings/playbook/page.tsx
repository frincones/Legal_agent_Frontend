import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { PlaybookEditor } from '@/components/playbook/PlaybookEditor';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPlaybookPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={
            <>
              <Link href="/settings" className="hover:underline">Settings</Link>
              <span className="mx-1.5">/</span>
              <span className="text-accent">Playbook</span>
            </>
          }
          title="Playbook del despacho"
          subtitle="Reglas que LexAI aplica al redactar y revisar documentos · todas las skills lo leen automáticamente."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mb-4">
            <SettingsTabs active="playbook" />
          </div>
          <PlaybookEditor />
        </div>
      </main>
    </AppShell>
  );
}
