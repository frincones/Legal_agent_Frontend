/**
 * Sprint M21.S3.C · Page · /v2/matters
 *
 * Lista los matters workspace v2 + form inline para crear.
 * NO sustituye a /v2/casos (legacy basado en tabla `matters`).
 */
import { AppShell } from '@/components/shell/AppShell';
import MattersListClient from '@/components/v2/matters/MattersListClient';

export const dynamic = 'force-dynamic';

export default function MattersV2Page() {
  return (
    <AppShell active="inicio">
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto h-full"
        style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
      >
        <div className="max-w-3xl w-full mx-auto px-6 py-10">
          <MattersListClient />
        </div>
      </main>
    </AppShell>
  );
}
