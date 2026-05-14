import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export const dynamic = 'force-dynamic';

export default function AuditPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Auditoría admin</h1>
      <p className="mb-6 text-[12.5px] muted">Todas las acciones realizadas desde el panel SaaS admin.</p>
      <AuditLogViewer />
    </div>
  );
}
