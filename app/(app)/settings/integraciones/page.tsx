import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { IntegrationsManager } from '@/components/settings/IntegrationsManager';
import { CalendarIntegrationsManager } from '@/components/settings/CalendarIntegrationsManager';
import { WhatsAppIntegrationPanel } from '@/components/settings/WhatsAppIntegrationPanel';
import { IntegrationsGrid } from '@/components/settings/IntegrationsGrid';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function SettingsIntegraciones() {
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
              <span className="text-accent">Integraciones</span>
            </>
          }
          title="Integraciones"
          subtitle="Conecta tu correo y recibe notificaciones del juzgado clasificadas automáticamente."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mb-4">
            <SettingsTabs active="integraciones" />
          </div>
          <div className="grid gap-6">
            <IntegrationsManager />
            <CalendarIntegrationsManager />
            <WhatsAppIntegrationPanel />
            <IntegrationsGrid />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
