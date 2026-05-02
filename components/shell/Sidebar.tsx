import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';
import { Ic } from '@/components/atoms/icons';
import { SidebarSearchTrigger } from '@/components/shell/SidebarSearchTrigger';
import { SidebarCloseButton } from '@/components/shell/SidebarCloseButton';
import { cn } from '@/lib/utils';

export type SidebarKey =
  | 'inicio'
  | 'casos'
  | 'canvas'
  | 'clientes'
  | 'calendario'
  | 'documentos'
  | 'inbox';

type SidebarItem = {
  id: SidebarKey;
  href: string;
  icon: keyof typeof Ic;
  label: string;
  count?: number | null;
  accent?: boolean;
};

export function Sidebar({
  active,
  firmName = 'Despacho',
  user = { name: 'Usuario', cedula: '' },
  nsm = { documentos: 0, meta: 40, deltaPct: 0 },
  counts = {},
}: {
  active: SidebarKey;
  firmName?: string;
  user?: { name: string; cedula: string };
  nsm?: { documentos: number; meta: number; deltaPct: number };
  counts?: Partial<Record<SidebarKey, number>>;
}) {
  const items: SidebarItem[] = [
    { id: 'inicio', href: '/inicio', icon: 'home', label: 'Inicio' },
    { id: 'casos', href: '/casos', icon: 'folder', label: 'Casos', count: counts.casos ?? null },
    { id: 'canvas', href: '/casos', icon: 'bolt', label: 'Live Canvas', accent: true },
    { id: 'clientes', href: '/clientes', icon: 'users', label: 'Clientes', count: counts.clientes ?? null },
    { id: 'calendario', href: '/calendario', icon: 'cal', label: 'Calendario', count: counts.calendario ?? null },
    { id: 'documentos', href: '/documentos', icon: 'doc', label: 'Documentos' },
    { id: 'inbox', href: '/notificaciones', icon: 'inbox', label: 'Notificaciones', count: counts.inbox ?? null },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col gap-[6px] overflow-y-auto border-r border-line bg-bg p-[14px_12px_12px]">
      <div className="flex flex-col px-1 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <Logo size={15} />
          <div className="ml-[2px] text-[11.5px] font-medium text-ink-3">{firmName}</div>
          <SidebarCloseButton />
          <button className="btn btn-icon btn-ghost btn-sm ml-auto hidden md:inline-flex" aria-label="Más">
            {Ic.dots}
          </button>
        </div>
        <SidebarSearchTrigger />
      </div>

      <nav className="flex flex-col gap-px py-1">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <Link
              key={it.id}
              href={it.href}
              className={cn(
                'flex items-center gap-[10px] rounded-lg px-[10px] py-[7px] text-[13px] font-medium text-ink-2 transition-colors',
                'hover:bg-bg-sunken hover:text-ink',
                isActive && 'bg-bg-elev text-ink shadow-1',
                it.accent && 'text-accent',
                it.accent && isActive && 'bg-accent-soft',
              )}
            >
              {Ic[it.icon]}
              <span>{it.label}</span>
              {typeof it.count === 'number' && (
                <span className="ml-auto inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-md bg-bg-sunken px-[5px] text-[11px] font-medium text-ink-3">
                  {it.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col gap-3 px-1 py-[6px]">
        <div className="surface p-[10px_12px]">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Documentos verificados · {new Date().toLocaleString('es-CO', { month: 'long' })}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="serif tabular text-2xl font-semibold leading-none -tracking-[0.02em]">
              {nsm.documentos}
            </span>
            <span className="chip chip-green">
              <span className="dot" />+{nsm.deltaPct}%
            </span>
          </div>
          <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-bg-sunken">
            <span
              className="block h-full rounded-full bg-ok"
              style={{ width: `${Math.min(100, (nsm.documentos / nsm.meta) * 100)}%` }}
            />
          </div>
          <div className="mt-[5px] text-[11px] muted">Meta: {nsm.meta} / mes</div>
        </div>

        <div className="flex items-center gap-[10px] border-t border-line pt-3">
          <div
            className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, rgb(var(--accent-rgb)), rgb(var(--purple-rgb)))' }}
          >
            {user.name.split(' ').slice(-1)[0]?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold">{user.name}</div>
            <div className="text-[11px] muted">{user.cedula} · verificada</div>
          </div>
          <Link href="/settings/despacho" className="btn btn-icon btn-ghost btn-sm" aria-label="Configuración">
            {Ic.setting}
          </Link>
        </div>
      </div>
    </div>
  );
}
