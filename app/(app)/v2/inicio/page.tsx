/**
 * F2-T04 · LexAI UX v2 — Home v2 / Day Briefing
 *
 * Server Component (RSC): genera el briefing del día en el servidor,
 * lo pasa al DayBriefingPageClient (client island) que maneja el layout
 * scroll + composer sticky.
 *
 * Layout: AppShell con sidebar v2 (si flag ON) + zona scroll + composer fijo.
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
      {/* flex-1 min-w-0 para ocupar todo el espacio horizontal sin desbordar el sidebar */}
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden h-full"
        style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
      >
        <DayBriefingPageClient data={data} />
      </main>
    </AppShell>
  );
}
