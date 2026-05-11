import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { InvoicesList } from '@/components/billing/InvoicesList';
import { createClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function FacturacionPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

  const supabase = createClient();
  const { data: mattersRows } = await supabase
    .from('matters')
    .select('id, titulo, expediente, client_id, status')
    .order('created_at', { ascending: false });
  const matters = (mattersRows ?? [])
    .filter((m: any) => m.status !== 'archivado')
    .map((m: any) => ({ id: m.id, titulo: m.titulo, expediente: m.expediente, client_id: m.client_id }));

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Facturación"
          title="Facturas"
          subtitle="Crea facturas desde horas y gastos · IVA Colombia · seguimiento de cobros"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <InvoicesList matters={matters} />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
