import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { GlobalSearchPanel } from '@/components/search/GlobalSearchPanel';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  const initialQuery = (searchParams?.q || '').trim();

  return (
    <AppShell active="buscar">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Buscar"
          title="Búsqueda global"
          subtitle="Casos · Clientes · Documentos · FTS español"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-4xl">
            <GlobalSearchPanel initialQuery={initialQuery} />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
