import { HelperTipsPanel } from '@/components/admin/HelperTipsPanel';

export const dynamic = 'force-dynamic';

export default function HelperTipsPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Helper Tips</h1>
      <p className="mb-6 text-[12.5px] muted">
        Tips contextuales que LexAI muestra al usuario en cada pantalla
        (botón "?" abajo a la derecha en la app cliente).
      </p>
      <HelperTipsPanel />
    </div>
  );
}
