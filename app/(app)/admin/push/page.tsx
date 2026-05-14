import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { PushAdminPanel } from '@/components/admin/PushAdminPanel';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function AdminPushPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  const allowed = ['admin', 'socio_senior', 'socio_junior'];
  if (!principal.role || !allowed.includes(principal.role)) {
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
              <span className="text-accent">Push</span>
            </>
          }
          title="Web Push · VAPID"
          subtitle="Notificaciones push del navegador · Sprint 12"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-5xl">
            <PushAdminPanel />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
