import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { AuditViewer } from '@/components/admin/AuditViewer';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  // Permisos: admin / socio_senior / socio_junior
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
              <span className="text-accent">Audit log</span>
            </>
          }
          title="Auditoría · Habeas Data"
          subtitle="Ley 1581/2012 · Append-only · 12 meses retención"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-6xl">
            <AuditViewer />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
