import Link from 'next/link';
import { cn } from '@/lib/utils';

export type CaseTableRow = {
  id: string;
  display_id: string;
  cliente: string;
  titulo: string;
  materia: string;
  etapa: string;
  tribunal: string;
  expediente: string;
  proxima: string;
  proxima_tipo: string;
  dias_restantes: number | null;
  owner: string;
  prioridad: 'alta' | 'media' | 'baja';
  pendientes: number;
  docs: number;
  ultimo: string;
};

const MATERIA_CLASS: Record<string, string> = {
  Laboral: 'chip-amber',
  laboral: 'chip-amber',
  Civil: 'chip-blue',
  civil: 'chip-blue',
  Comercial: 'chip-purple',
  comercial: 'chip-purple',
  Mercantil: 'chip-purple',
  mercantil: 'chip-purple',
  Tutela: 'chip-red',
  tutela: 'chip-red',
  Constitucional: 'chip-red',
  constitucional: 'chip-red',
  Familiar: 'chip-purple',
  familiar: 'chip-purple',
  Administrativo: 'chip-blue',
  administrativo: 'chip-blue',
  Penal: 'chip-red',
  penal: 'chip-red',
  Fiscal: 'chip-amber',
  fiscal: 'chip-amber',
};

const PRIO_CLASS: Record<'alta' | 'media' | 'baja', string> = {
  alta: 'bg-danger',
  media: 'bg-warn',
  baja: 'bg-ink-4',
};

export function CasesTable({ rows }: { rows: CaseTableRow[] }) {
  return (
    <div className="surface overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-bg-sunken">
            <Th className="w-[36%]">Caso</Th>
            <Th>Materia</Th>
            <Th>Etapa</Th>
            <Th>Próxima fecha</Th>
            <Th>Owner</Th>
            <Th className="text-right">Pendientes</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0 hover:bg-bg-sunken">
              <Td>
                <Link href={`/casos/${c.id}`} className="flex items-center gap-[10px]">
                  <span
                    className={cn('h-[6px] w-[6px] flex-none rounded-full', PRIO_CLASS[c.prioridad])}
                    title={c.prioridad}
                  />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold -tracking-[0.01em]">{c.titulo}</div>
                    <div className="text-[11.5px] muted">
                      {c.tribunal} · Exp. {c.expediente}
                    </div>
                  </div>
                </Link>
              </Td>
              <Td>
                <span className={cn('chip', MATERIA_CLASS[c.materia] ?? '')}>{c.materia}</span>
              </Td>
              <Td>
                <span className="text-[12.5px] muted">{c.etapa}</span>
              </Td>
              <Td>
                <div className="text-[12.5px]">{c.proxima}</div>
                <div className="text-[11px] muted">{c.proxima_tipo}</div>
              </Td>
              <Td>
                <span className="text-[12.5px] muted">{c.owner.replace('Lic. ', '')}</span>
              </Td>
              <Td className="text-right">
                {c.pendientes > 0 ? (
                  <span className="chip chip-amber">{c.pendientes}</span>
                ) : (
                  <span className="muted">—</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-[14px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-wider muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-[14px] py-[10px] align-middle text-[13px]', className)}>{children}</td>;
}
