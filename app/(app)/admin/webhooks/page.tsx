import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { WebhooksManager } from '@/components/admin/WebhooksManager';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function AdminWebhooksPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  if (!principal.role || !['admin', 'socio_senior', 'socio_junior'].includes(principal.role)) {
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
              <span className="text-accent">Webhooks</span>
            </>
          }
          title="Webhooks salientes"
          subtitle="Notifica eventos a Zapier · Make · tu propia app · HMAC SHA-256"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto max-w-5xl">
            <WebhooksManager />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
