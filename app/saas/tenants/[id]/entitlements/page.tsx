import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FirmEntitlementsPanel } from '@/components/admin/FirmEntitlementsPanel';

export const dynamic = 'force-dynamic';

export default function FirmEntitlementsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <Link href={`/saas/tenants/${params.id}`} className="mb-3 inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink">
        <ArrowLeft size={12} /> Volver a la firma
      </Link>
      <h1 className="serif mb-1 text-[22px] font-semibold">Entitlements de la firma</h1>
      <p className="mb-6 text-[12.5px] muted">
        Override custom de módulos y cuotas para esta firma específica. Los overrides
        tienen prioridad sobre el plan y pueden expirar automáticamente.
      </p>
      <FirmEntitlementsPanel firmId={params.id} />
    </div>
  );
}
