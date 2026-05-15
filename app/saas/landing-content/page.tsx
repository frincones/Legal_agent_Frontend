import { LandingContentManager } from '@/components/admin/LandingContentManager';

export const dynamic = 'force-dynamic';

export default function LandingContentPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Contenido público</h1>
      <p className="mb-6 text-[12.5px] muted">
        Gestiona testimonios + changelog que aparecen en la landing pública, /customers y /changelog.
      </p>
      <LandingContentManager />
    </div>
  );
}
