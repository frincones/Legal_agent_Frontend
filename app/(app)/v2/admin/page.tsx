import { AppShell } from '@/components/shell/AppShell';
import AdminDashboard from '@/components/v2/admin/AdminDashboard';
export const dynamic = 'force-dynamic';
export default function AdminPage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto h-full"
            style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}>
        <div className="max-w-5xl w-full mx-auto px-6 py-10">
          <AdminDashboard />
        </div>
      </main>
    </AppShell>
  );
}
