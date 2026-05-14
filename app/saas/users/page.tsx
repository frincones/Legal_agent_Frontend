import { UsersTable } from '@/components/admin/UsersTable';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Usuarios cross-firm</h1>
      <p className="mb-6 text-[12.5px] muted">Todos los usuarios LexAI · reset password + cambio de rol.</p>
      <UsersTable />
    </div>
  );
}
