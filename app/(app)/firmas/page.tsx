import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { EnvelopesList } from '@/components/signatures/EnvelopesList';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function FirmasPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Firmas"
          title="Firmas electrónicas"
          subtitle="Sobres con Certicámara · DocuSign · Demo · audit trail completo"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <EnvelopesList />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
