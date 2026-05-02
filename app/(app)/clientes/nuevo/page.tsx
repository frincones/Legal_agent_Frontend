import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { NewClientForm } from '@/components/clientes/NewClientForm';

export const dynamic = 'force-dynamic';

export default function NuevoClientePage() {
  return (
    <AppShell active="clientes">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Clientes / Nuevo"
          title="Nuevo cliente"
          subtitle="Registra al cliente y captura el consentimiento Habeas Data (Ley 1581/2012)"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto w-full max-w-2xl">
            <NewClientForm />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
