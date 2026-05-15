import { ModulesMatrix } from '@/components/admin/ModulesMatrix';

export const dynamic = 'force-dynamic';

export default function AdminModulesPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Catálogo de módulos</h1>
      <p className="mb-6 text-[12.5px] muted">
        Define qué módulos del producto incluye cada plan. Los cambios aplican
        inmediatamente para todos los firms del plan (cache 30s).
      </p>
      <ModulesMatrix />
    </div>
  );
}
