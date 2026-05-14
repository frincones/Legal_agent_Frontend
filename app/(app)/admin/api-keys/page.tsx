import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { ApiKeysManager } from '@/components/admin/ApiKeysManager';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function AdminApiKeysPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  if (!principal.role || !['admin', 'socio_senior'].includes(principal.role)) {
    redirect('/');
  }
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={
            <>
              <Link href="/" className="hover:underline">Admin</Link>
              <span className="mx-1.5">/</span>
              <span className="text-accent">API Keys</span>
            </>
          }
          title="API pública · Keys"
          subtitle="Acceso programático con scopes y rate limit"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-5xl">
            <ApiKeysManager />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
