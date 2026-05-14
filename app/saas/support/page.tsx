import { SupportQueue } from '@/components/admin/SupportQueue';

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Cola de soporte</h1>
      <p className="mb-6 text-[12.5px] muted">Tickets cross-firm · assign + responder + cambiar estado.</p>
      <SupportQueue />
    </div>
  );
}
