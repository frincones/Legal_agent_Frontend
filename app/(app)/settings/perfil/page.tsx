import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { ProfileEditor } from '@/components/settings/ProfileEditor';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPerfil() {
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
              <span className="text-accent">Mi perfil</span>
            </>
          }
          title="Mi perfil profesional"
          subtitle="Modo de ejercicio, áreas de práctica y datos de contacto profesional."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4">
              <SettingsTabs active="perfil" />
            </div>
            <ProfileEditor />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
