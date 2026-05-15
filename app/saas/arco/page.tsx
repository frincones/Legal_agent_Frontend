import { ArcoQueue } from '@/components/admin/ArcoQueue';

export const dynamic = 'force-dynamic';

export default function AdminArcoPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Solicitudes ARCO (Habeas Data)</h1>
      <p className="mb-6 text-[12.5px] muted">
        Queue de solicitudes según Ley 1581/2012 (CO) · SLA 15 días hábiles desde creación.
      </p>
      <ArcoQueue />
    </div>
  );
}
