/**
 * Sprint M21.S3.B · Page · /v2/onboarding/cold-start
 *
 * Renderiza ColdStartWizard dentro del AppShell estandar v2.
 */
import { AppShell } from '@/components/shell/AppShell';
import ColdStartWizard from '@/components/v2/onboarding/ColdStartWizard';

export const dynamic = 'force-dynamic';

export default function ColdStartPage() {
  return (
    <AppShell active="inicio">
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto h-full"
        style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
      >
        <div className="max-w-2xl w-full mx-auto px-6 py-10">
          <header className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold text-zinc-900">Configura tu firma</h1>
            <p className="text-sm text-zinc-600">
              Responde 4 partes cortas para que LexAI personalice los documentos, las áreas
              de práctica y los guardrails de tu equipo.
            </p>
          </header>
          <ColdStartWizard />
        </div>
      </main>
    </AppShell>
  );
}
