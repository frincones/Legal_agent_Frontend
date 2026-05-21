/**
 * F2-T04 · LexAI UX v2 — Home v2 / Day Briefing
 *
 * Server Component (RSC): genera el briefing del día en el servidor,
 * lo pasa al DayBriefingPageClient (client island) que maneja el composer.
 *
 * Layout: AppShell con sidebar v2 (si flag ON) + contenedor centrado max-w-3xl.
 * Activación: se llega aquí desde el redirect en app/(app)/inicio/page.tsx
 *             cuando NEXT_PUBLIC_UX_V2_HOME=true.
 *
 * TODO F3: reemplazar InlineComposerV2 con ComposerV2 completo.
 */

import { AppShell } from '@/components/shell/AppShell';
import { generateDayBriefing } from '@/lib/v2/dayBriefing';
import { DayBriefingPageClient } from '@/components/v2/home/DayBriefingPageClient';

export const revalidate = 60;

export default async function InicioV2Page() {
  // Generamos el briefing en el servidor para cero latencia de hidratación.
  // Si falla (error de red, sin sesión), generateDayBriefing usa fallbacks vacíos.
  const data = await generateDayBriefing();

  return (
    <AppShell active="inicio">
      <main
        className="flex min-h-0 min-w-0 flex-col overflow-auto"
        style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
      >
        {/* Área de scroll con padding generoso */}
        <div
          className="mx-auto w-full max-w-3xl px-6 py-10"
          style={{ minHeight: '100vh' }}
        >
          <DayBriefingPageClient data={data} />
        </div>
      </main>
    </AppShell>
  );
}
