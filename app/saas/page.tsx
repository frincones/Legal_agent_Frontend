import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export default function AdminHomePage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Dashboard</h1>
      <p className="mb-6 text-[12.5px] muted">
        Estado en tiempo real del SaaS · MRR, signups, cartera, tickets, churn.
      </p>
      <AdminDashboard />
    </div>
  );
}
