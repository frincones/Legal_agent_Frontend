import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { CanvasMain } from '@/components/canvas/CanvasMain';
import { CitationsSidebar } from '@/components/canvas/CitationsSidebar';
import { ExportDocxButton } from '@/components/canvas/ExportDocxButton';
import { PreflightModal } from '@/components/canvas/PreflightModal';
import { CanvasAIActions } from '@/components/canvas/CanvasAIActions';
import { GenerateWritDialog } from '@/components/canvas/GenerateWritDialog';
import { LegalToolbox } from '@/components/canvas/LegalToolbox';
import { fetchMatter } from '@/lib/api/rsc-fetchers';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 30;

export default async function CanvasPage({ params }: { params: { matterId: string } }) {
  const [matter, principal] = await Promise.all([
    fetchMatter(params.matterId),
    getSessionPrincipal(),
  ]);
  if (!matter) return notFound();
  const userInfo = principal
    ? { name: principal.email?.split('@')[0] || 'Usuario', email: principal.email || undefined }
    : undefined;

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={
            <>
              <Link href="/casos" className="hover:underline">Casos</Link>
              <span className="mx-1.5">/</span>
              <Link href={`/casos/${matter.id}`} className="hover:underline">{matter.titulo}</Link>
              <span className="mx-1.5">/</span>
              <span className="text-accent">Live Canvas</span>
            </>
          }
          title={
            <>
              {matter.titulo} <span className="chip chip-amber ml-2 align-middle">Borrador</span>
            </>
          }
          subtitle={`${matter.materia} · ${matter.tribunal}`}
          actions={
            <>
              <button className="btn btn-sm">{Ic.pause} Pausar</button>
              <GenerateWritDialog
                matterId={matter.id}
                trigger={
                  <button type="button" className="btn btn-sm" aria-label="Generar escrito">
                    {Ic.sparkle} Generar escrito
                  </button>
                }
              />
              <CanvasAIActions />
              <ExportDocxButton
                matterId={matter.id}
                matterTitle={matter.titulo}
                matterMateria={matter.materia ?? undefined}
                matterTribunal={matter.tribunal ?? undefined}
              />
              <PreflightModal
                matterId={matter.id}
                trigger={
                  <button type="button" className="btn btn-primary" aria-label="Revisar y radicar">
                    {Ic.send} Revisar y radicar
                  </button>
                }
              />
            </>
          }
        />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[260px_1fr_320px]">
          {/* Rail izquierdo · Toolbox jurídico (latinismos, fórmulas, cláusulas) */}
          <aside className="hidden lg:block">
            <LegalToolbox />
          </aside>
          {/* Editor principal · TipTap con co-edición agente↔abogado */}
          <CanvasMain matterId={matter.id} userInfo={userInfo} />
          {/* Rail derecho · Citas verificadas en vivo contra fuentes oficiales */}
          <aside className="hidden lg:block">
            <CitationsSidebar matterId={matter.id} />
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
