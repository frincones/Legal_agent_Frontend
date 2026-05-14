import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { IntakeAdminPanel } from '@/components/intake/IntakeAdminPanel';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function IntakeFormsAdminPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  // Sólo admin/socios pueden gestionar intake forms. Si no, mandar a /inicio.
  const allowed = ['admin', 'socio_senior', 'socio_junior', 'in_house', 'independiente', 'consultor'];
  if (!principal.role || !allowed.includes(principal.role)) {
    redirect('/inicio?denied=intake-forms');
  }
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Intake"
          title="Formularios de captación"
          subtitle="Cada submission se convierte automáticamente en lead asignado"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-5xl">
            <IntakeAdminPanel />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
