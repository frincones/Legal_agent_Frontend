import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { BillingPanel } from '@/components/billing/BillingPanel';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsBilling() {
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
              <span className="text-accent">Plan y facturación</span>
            </>
          }
          title="Plan y facturación"
          subtitle="Consulta tu plan, uso vs cuotas, y cambia o cancela cuando quieras"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto flex max-w-5xl flex-col gap-5">
            <SettingsTabs active="billing" />
            <BillingPanel role={principal.role ?? 'in_house'} />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
