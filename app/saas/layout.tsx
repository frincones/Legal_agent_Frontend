import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

async function fetchAdminMe(): Promise<{ email: string; role: string; full_name: string | null } | null> {
  try {
    const h = headers();
    const cookie = h.get('cookie') || '';
    const proto = h.get('x-forwarded-proto') || 'https';
    const host = h.get('host') || 'localhost:3000';
    const r = await fetch(`${proto}://${host}/api/admin/me`, {
      cache: 'no-store',
      headers: { cookie },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

  const me = await fetchAdminMe();
  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="surface max-w-md p-6 text-center">
          <h1 className="serif mb-2 text-[20px] font-semibold">Acceso restringido</h1>
          <p className="text-[13px] muted">
            Esta área es solo para administradores del SaaS LexAI. Si crees que deberías
            tener acceso, contacta al owner del proyecto.
          </p>
          <a href="/inicio" className="btn btn-primary btn-sm mt-4">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-ink">
      <AdminSidebar role={me.role} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopBar adminEmail={me.email} adminRole={me.role} fullName={me.full_name} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
