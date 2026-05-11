import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { TemplatesManager } from '@/components/settings/TemplatesManager';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsTemplates() {
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
              <span className="text-accent">Plantillas</span>
            </>
          }
          title="Plantillas del despacho"
          subtitle="Sube tus formatos .docx y reusa con variables · {{nombre_cliente}}, {{expediente}}, etc."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mb-4">
            <SettingsTabs active="plantillas" />
          </div>
          <TemplatesManager currentUserId={principal.user_id} />
        </div>
      </main>
    </AppShell>
  );
}
