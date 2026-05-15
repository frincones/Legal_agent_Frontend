import { PlansViewer } from '@/components/admin/PlansViewer';

export const dynamic = 'force-dynamic';

export default function AdminPlansPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Catálogo de planes</h1>
      <p className="mb-6 text-[12.5px] muted">
        Vista resuelta de los 5 planes con módulos habilitados + cuotas vigentes
        (fuente: <code className="mono">plan_modules</code> + <code className="mono">plan_quotas</code>).
        Para editar, usa <strong>Módulos</strong> o <strong>Cuotas</strong> en el menú lateral.
      </p>
      <PlansViewer />
    </div>
  );
}
