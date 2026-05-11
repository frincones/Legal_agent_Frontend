import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'perfil', href: '/settings/perfil', label: 'Mi perfil' },
  { id: 'usuarios', href: '/settings/usuarios', label: 'Usuarios' },
  { id: 'equipo', href: '/settings/equipo', label: 'Equipos' },
  { id: 'plantillas', href: '/settings/templates', label: 'Plantillas' },
  { id: 'integraciones', href: '/settings/integraciones', label: 'Integraciones' },
  { id: 'despacho', href: '/settings/despacho', label: 'Despacho' },
  { id: 'privacidad', href: '/settings/privacidad', label: 'Privacidad' },
] as const;

export type SettingsTab = (typeof TABS)[number]['id'];

export function SettingsTabs({ active }: { active: SettingsTab }) {
  return (
    <nav className="surface flex flex-wrap gap-1 p-1" aria-label="Settings">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors',
            t.id === active
              ? 'bg-accent text-white'
              : 'text-ink-2 hover:bg-bg-sunken hover:text-ink',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
