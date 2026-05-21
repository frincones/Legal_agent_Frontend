/**
 * /threads/[id] — Stub de vista de hilo (LexAI UX v2 · Fase 1)
 *
 * Esta ruta sirve como destino de los items del SidebarHilosList.
 * El contenido completo (thread de conversación con artifacts) se
 * implementa en Fase 2/3 del plan de ejecución UX v2.
 *
 * F2+: reemplazar por el componente <ConversationThread>.
 */
import { AppShell } from '@/components/shell/AppShell';

interface ThreadPageProps {
  params: { id: string };
}

export default function ThreadPage({ params }: ThreadPageProps) {
  return (
    <AppShell active="inicio">
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="text-center">
          <h1 className="text-[20px] font-semibold text-[var(--v2-text-primary,#1A1916)]">
            Hilo de conversación
          </h1>
          <p className="mt-2 text-[14px] text-[var(--v2-text-secondary,#4A4944)]">
            ID: <code className="font-mono text-[13px]">{params.id}</code>
          </p>
          <p className="mt-3 max-w-[360px] text-[13px] leading-relaxed text-[var(--v2-text-tertiary,#807E76)]">
            La vista de hilos individuales estará disponible en la Fase 2 del rollout UX v2.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
