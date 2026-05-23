/**
 * /admin/pipeline
 *
 * Modulo admin para monitorear el pipeline de ingesta del corpus legal
 * colombiano en tiempo real.
 *
 * Muestra:
 *  - Estado global (health, workers, jobs, storage, costos)
 *  - Progreso por fuente (17 fuentes oficiales CO)
 *  - Workers ejecutando + cronjobs programados
 *  - Inventario detallado del corpus
 *  - Logs en tiempo real
 *
 * Endpoints: app/api/admin/pipeline/{status,sources,inventory,jobs,logs}
 * que proxean al backend Railway. Si backend no esta listo, devuelven
 * mocked data realista (lib/admin/pipeline/mockData.ts).
 *
 * Acceso restringido: solo admins (validacion en endpoints).
 */
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { PipelineDashboard } from '@/components/admin/pipeline/PipelineDashboard';

export const dynamic = 'force-dynamic';

export default function AdminPipelinePage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Admin · Pipeline"
          title="Pipeline de Ingesta"
          subtitle="Monitor en tiempo real del corpus legal colombiano · 17 fuentes oficiales · auto-refresh 10s"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto w-full max-w-7xl">
            <PipelineDashboard />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
