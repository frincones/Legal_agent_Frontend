import { CarteraPanel } from '@/components/admin/CarteraPanel';

export const dynamic = 'force-dynamic';

export default function AdminCarteraPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Cartera</h1>
      <p className="mb-6 text-[12.5px] muted">Facturas cross-firm · aging · marcar pagadas manualmente.</p>
      <CarteraPanel />
    </div>
  );
}
