import { QuotasMatrix } from '@/components/admin/QuotasMatrix';

export const dynamic = 'force-dynamic';

export default function AdminQuotasPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Cuotas por plan</h1>
      <p className="mb-6 text-[12.5px] muted">
        Define los límites de consumo por plan · null = ilimitado · 0 = sin acceso.
      </p>
      <QuotasMatrix />
    </div>
  );
}
