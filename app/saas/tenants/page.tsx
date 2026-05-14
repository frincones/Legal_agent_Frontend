import { TenantsTable } from '@/components/admin/TenantsTable';

export const dynamic = 'force-dynamic';

export default function TenantsPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Tenants (Firms)</h1>
      <p className="mb-6 text-[12.5px] muted">
        Todas las firmas registradas en LexAI · filtros + acciones admin.
      </p>
      <TenantsTable />
    </div>
  );
}
