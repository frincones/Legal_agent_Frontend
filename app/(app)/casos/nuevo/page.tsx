import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { fetchClients } from '@/lib/api/rsc-fetchers';
import { NewMatterForm } from '@/components/casos/NewMatterForm';

export const dynamic = 'force-dynamic';

export default async function NuevoCasoPage() {
  const clients = await fetchClients();
  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Casos / Nuevo"
          title="Nuevo caso"
          subtitle="Vincula el caso a un cliente y registra los datos básicos"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto w-full max-w-2xl">
            <NewMatterForm
              clients={clients.map((c) => ({
                id: c.id,
                nombre: c.nombre,
                tax_id: c.tax_id ?? c.personal_id ?? null,
              }))}
            />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
