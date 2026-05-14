import { PlansViewer } from '@/components/admin/PlansViewer';

export const dynamic = 'force-dynamic';

export default function AdminPlansPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Catálogo de planes</h1>
      <p className="mb-6 text-[12.5px] muted">
        Definición vigente de planes · para editar precios/cuotas, ajusta el seed en
        <code className="ml-1 mono">backend/storage/schemas/2026_05_10_sprint6.sql</code> y reaplica la migración.
      </p>
      <PlansViewer />
    </div>
  );
}
