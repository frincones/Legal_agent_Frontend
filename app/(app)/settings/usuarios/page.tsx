import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { UsersManager } from '@/components/settings/UsersManager';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsUsuarios() {
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
              <span className="text-accent">Usuarios</span>
            </>
          }
          title="Usuarios del despacho"
          subtitle="Invita nuevos abogados, cambia roles o desactiva accesos."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mb-4">
            <SettingsTabs active="usuarios" />
          </div>
          <UsersManager
            currentUserId={principal.user_id}
            currentUserRole={principal.role ?? 'lawyer'}
          />
        </div>
      </main>
    </AppShell>
  );
}
