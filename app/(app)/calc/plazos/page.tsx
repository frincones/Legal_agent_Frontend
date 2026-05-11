import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { PlazosForm } from '@/components/calc/PlazosForm';

export const dynamic = 'force-dynamic';

export default function PlazosPage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calculadoras / Plazos procesales"
          title="Plazos procesales"
          subtitle="Días hábiles + festivos nacionales + vacancia judicial · CGP, CST, Decreto 2591/91, Ley 1755/2015"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <PlazosForm />
        </div>
      </main>
    </AppShell>
  );
}
