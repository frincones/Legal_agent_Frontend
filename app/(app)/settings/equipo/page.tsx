import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import Link from 'next/link';
import { TeamsManager } from '@/components/settings/TeamsManager';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsEquipo() {
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
              <span className="text-accent">Equipo</span>
            </>
          }
          title="Sub-equipos del despacho"
          subtitle="Cada socio puede armar su 'equipito' con asociados y paralegales a cargo."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4">
              <SettingsTabs active="equipo" />
            </div>
            <TeamsManager userRole={principal.role ?? 'lawyer'} />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
