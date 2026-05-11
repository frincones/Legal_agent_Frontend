import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { UsageDashboard } from '@/components/settings/UsageDashboard';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsUso() {
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
              <span className="text-accent">Uso</span>
            </>
          }
          title="Uso del plan"
          subtitle="Consumo del periodo actual · cuotas vigentes"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto flex max-w-5xl flex-col gap-5">
            <SettingsTabs active="uso" />
            <UsageDashboard />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
