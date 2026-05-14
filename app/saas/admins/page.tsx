import { AdminsTable } from '@/components/admin/AdminsTable';

export const dynamic = 'force-dynamic';

export default function AdminsPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Admins SaaS</h1>
      <p className="mb-6 text-[12.5px] muted">
        Gestiona el equipo que tiene acceso a este panel · solo Owners pueden editar.
      </p>
      <AdminsTable />
    </div>
  );
}
