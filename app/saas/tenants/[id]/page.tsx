import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TenantDetail } from '@/components/admin/TenantDetail';

export const dynamic = 'force-dynamic';

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <Link href="/saas/tenants" className="mb-3 inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink">
        <ArrowLeft size={12} /> Volver a tenants
      </Link>
      <TenantDetail firmId={params.id} />
    </div>
  );
}
