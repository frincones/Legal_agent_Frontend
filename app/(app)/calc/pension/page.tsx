import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { PensionForm } from '@/components/calc/PensionForm';

export const dynamic = 'force-dynamic';

export default function PensionPage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calculadoras / Pensión"
          title="Pensión"
          subtitle="Vejez · invalidez · sobrevivencia · orfandad · Ley 100/93 + Ley 797/2003 + Ley 860/2003"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <PensionForm />
        </div>
      </main>
    </AppShell>
  );
}
