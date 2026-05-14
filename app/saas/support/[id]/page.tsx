import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TicketDetail } from '@/components/admin/TicketDetail';

export const dynamic = 'force-dynamic';

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <Link href="/saas/support" className="mb-3 inline-flex items-center gap-1 text-[11.5px] text-ink-3 hover:text-ink">
        <ArrowLeft size={12} /> Volver a soporte
      </Link>
      <TicketDetail ticketId={params.id} />
    </div>
  );
}
