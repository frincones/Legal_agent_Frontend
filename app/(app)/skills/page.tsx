/**
 * /skills — Skills Hub de LexAI UX v2
 *
 * Muestra todos los skills disponibles del firm en un grid filtrable.
 * Reemplaza el stub anterior (que mostraba "próximamente").
 */
import { AppShell } from '@/components/shell/AppShell';
import { SkillsHub } from '@/components/v2/skills/SkillsHub';

export default function SkillsPage() {
  return (
    <AppShell active="inicio">
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto"
        style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <header className="mb-6">
            <h1
              className="text-[24px] font-semibold leading-tight"
              style={{ color: 'var(--v2-text-primary, #1A1916)' }}
            >
              Skills de LexAI
            </h1>
            <p
              className="mt-1 text-[14px]"
              style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
            >
              Herramientas especializadas para tareas jurídicas frecuentes.
            </p>
          </header>
          <SkillsHub />
        </div>
      </main>
    </AppShell>
  );
}
