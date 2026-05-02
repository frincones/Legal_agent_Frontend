import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { createClient } from '@/lib/supabase/server';
import { formatRelative } from '@/lib/utils';
import Link from 'next/link';

export const revalidate = 30;

type DocRow = {
  id: string;
  matter_id: string;
  kind: string;
  titulo: string;
  status: string;
  pages: number | null;
  byte_size: number | null;
  created_at: string;
  resumen_ia: string | null;
};

const KIND_LABEL: Record<string, string> = {
  demanda: 'Demanda',
  contestacion: 'Contestación',
  escrito: 'Escrito',
  tutela: 'Tutela',
  recurso: 'Recurso',
  contrato: 'Contrato',
  sentencia: 'Sentencia',
  recibido: 'Recibido',
  generado: 'Generado',
};

const KIND_CHIP: Record<string, string> = {
  demanda: 'chip-amber',
  contestacion: 'chip-blue',
  escrito: 'chip-blue',
  tutela: 'chip-red',
  recurso: 'chip-purple',
  contrato: 'chip-purple',
  sentencia: 'chip-green',
  recibido: 'chip',
  generado: 'chip-green',
};

export default async function DocumentosPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('matter_documents')
    .select('id, matter_id, kind, titulo, status, pages, byte_size, created_at, resumen_ia')
    .order('created_at', { ascending: false })
    .limit(100);
  const docs = (data ?? []) as DocRow[];

  const generados = docs.filter((d) => d.kind === 'generado').length;
  const recibidos = docs.filter((d) => d.kind === 'recibido').length;

  return (
    <AppShell active="documentos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Documentos"
          title="Biblioteca de documentos"
          subtitle={`${docs.length} documentos · ${generados} generados · ${recibidos} recibidos · OCR automático activo`}
          actions={<button className="btn btn-primary">{Ic.upload} Subir PDF</button>}
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {docs.length === 0 ? (
            <div className="surface p-12 text-center muted">No hay documentos cargados aún.</div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line bg-bg-sunken">
                    <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider muted">Documento</th>
                    <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider muted">Tipo</th>
                    <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider muted">Páginas</th>
                    <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider muted">Estado</th>
                    <th className="px-4 py-2 text-right text-[11px] uppercase tracking-wider muted">Subido</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="border-b border-line last:border-0 hover:bg-bg-sunken">
                      <td className="px-4 py-2.5">
                        <Link href={`/casos/${d.matter_id}`} className="block">
                          <div className="text-[13px] font-semibold">{d.titulo}</div>
                          {d.resumen_ia && (
                            <div className="line-clamp-1 text-[11.5px] muted">{d.resumen_ia}</div>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`chip ${KIND_CHIP[d.kind] ?? ''}`}>
                          {KIND_LABEL[d.kind] ?? d.kind}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] muted tabular">{d.pages ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`chip ${d.status === 'completed' ? 'chip-green' : d.status === 'processing' ? 'chip-amber' : ''}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[12px] muted">
                        {formatRelative(d.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
