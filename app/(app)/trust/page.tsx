import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { TrustDashboard } from '@/components/trust/TrustDashboard';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Fondos fiduciarios"
          title="Cuentas fiduciarias y conciliación"
          subtitle="Manejo segregado de fondos del cliente · Ley 1123/2007 CO"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <TrustDashboard />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
