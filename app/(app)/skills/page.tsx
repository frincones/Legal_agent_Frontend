/**
 * /skills — Stub de la página de Skills (LexAI UX v2 · Fase 1)
 *
 * Esta página actúa como destino del item "Skills" del SidebarV2.
 * El contenido completo (Skills Hub con tarjetas por verbo) se implementa
 * en la Fase 2/3 del plan de ejecución UX v2.
 *
 * F2+: reemplazar el contenido por el <SkillsHub> completo.
 */
import { AppShell } from '@/components/shell/AppShell';

export default function SkillsPage() {
  return (
    <AppShell active="inicio">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--v2-brand-navy-soft,#E8EDF7)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--v2-brand-navy,#0E2A5E)]"
          >
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-[22px] font-semibold text-[var(--v2-text-primary,#1A1916)]">
            Skills de LexAI
          </h1>
          <p className="mt-2 max-w-[380px] text-[14px] leading-relaxed text-[var(--v2-text-secondary,#4A4944)]">
            El hub de skills estará disponible próximamente. Mientras tanto, puede invocar
            cualquier skill escribiendo{' '}
            <code className="rounded bg-[var(--v2-bg-subtle,#F2F1EC)] px-[5px] py-[2px] text-[13px] font-mono">
              /skill
            </code>{' '}
            en el compositor o buscando con{' '}
            <kbd className="rounded border border-[var(--v2-border-default,#D4D2CA)] bg-white px-[6px] py-[2px] text-[12px] font-medium">
              ⌘K
            </kbd>.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
