import { StatusAdminPanel } from '@/components/admin/StatusAdminPanel';

export const dynamic = 'force-dynamic';

export default function StatusAdminPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Status page admin</h1>
      <p className="mb-6 text-[12.5px] muted">
        Gestiona incidents + corre probes manualmente · vista pública en <a href="/status" className="text-accent hover:underline">/status</a>
      </p>
      <StatusAdminPanel />
    </div>
  );
}
