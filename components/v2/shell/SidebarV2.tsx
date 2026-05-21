'use client';

/**
 * F1-T01 · LexAI UX v2 — SidebarV2
 *
 * Sidebar rediseñado con 5 items de navegación + hilos recientes + skills del firm.
 *
 * Flag de activación: NEXT_PUBLIC_UX_V2_SHELL=true
 * El AppShell muestra SidebarV2 con flag ON y el Sidebar legacy con flag OFF.
 *
 * Ancho: 240px expandido / 64px colapsado.
 * Animación: framer-motion 250ms ease.
 * Estado colapsado: persiste en localStorage (key: lexai-v2-sidebar-collapsed).
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Folder,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SidebarItemV2 } from './SidebarItemV2';
import { SidebarHilosList } from './SidebarHilosList';
import { SidebarSkillsList } from './SidebarSkillsList';
import { SidebarUserMenu } from './SidebarUserMenu';
import { SidebarToggle, readSidebarCollapsed, writeSidebarCollapsed } from './SidebarToggle';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { icon: Home,     label: 'Inicio',      href: '/inicio' },
  { icon: Folder,   label: 'Casos',       href: '/casos' },
  { icon: FileText, label: 'Documentos',  href: '/documentos' },
  { icon: Calendar, label: 'Calendario',  href: '/calendario' },
  { icon: Sparkles, label: 'Skills',      href: '/skills' },
] as const;

interface SidebarV2Props {
  /** Nombre del despacho/firma */
  firmName?: string;
  /** Nombre completo del usuario */
  userName?: string;
  /** Email del usuario */
  userEmail?: string;
}

export function SidebarV2({
  firmName = 'Despacho',
  userName = 'Usuario',
  userEmail,
}: SidebarV2Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Leer estado inicial desde localStorage (solo en el cliente)
  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    writeSidebarCollapsed(next);
  };

  // Iniciales para el avatar
  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[var(--v2-border-subtle,#E8E7E1)] bg-[var(--v2-bg-base,#FAFAF7)]"
      aria-label="Barra lateral principal"
    >
      {/* ── Header: Logo + Nombre firm + Toggle ── */}
      <div
        className={[
          'flex items-center border-b border-[var(--v2-border-subtle,#E8E7E1)] px-3 py-3',
          collapsed ? 'justify-center' : 'gap-2',
        ].join(' ')}
      >
        {/* Logo LexAI */}
        <span
          aria-label="LexAI"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--v2-brand-navy,#0E2A5E), var(--v2-accent-copper,#B8763C))',
          }}
        >
          L
        </span>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-[var(--v2-brand-navy,#0E2A5E)] leading-none">
              LexAI
            </div>
            <div className="truncate text-[10.5px] text-[var(--v2-text-tertiary,#807E76)] mt-[2px]">
              {firmName}
            </div>
          </div>
        )}

        <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {/* ── Cuerpo scrollable ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-2">

        {/* Sección: Navegación principal (5 items) */}
        <nav
          aria-label="Navegación principal"
          className={['flex flex-col gap-px', collapsed ? 'items-center px-[7px]' : 'px-2'].join(' ')}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/inicio'
                ? pathname === '/inicio' || pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <SidebarItemV2
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                collapsed={collapsed}
                active={isActive}
              />
            );
          })}
        </nav>

        {/* Separador */}
        <div className="my-2 border-t border-[var(--v2-border-subtle,#E8E7E1)]" />

        {/* Sección: Mis hilos (oculta en colapsado) */}
        {!collapsed && (
          <>
            <div className="px-[10px] pb-[4px] text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Mis hilos
            </div>
            <div className="px-2">
              <SidebarHilosList collapsed={collapsed} />
            </div>

            {/* Separador */}
            <div className="my-2 border-t border-[var(--v2-border-subtle,#E8E7E1)]" />

            {/* Sección: Plantillas y Skills (oculta en colapsado) */}
            <div className="px-[10px] pb-[4px] text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Plantillas y Skills
            </div>
            <div className="px-2">
              <SidebarSkillsList collapsed={collapsed} />
            </div>
          </>
        )}
      </div>

      {/* ── Footer: ThemeToggle + Usuario ── */}
      <div
        className={[
          'border-t border-[var(--v2-border-subtle,#E8E7E1)] px-2 py-2 flex flex-col gap-[2px]',
        ].join(' ')}
      >
        <ThemeToggle collapsed={collapsed} />
        <SidebarUserMenu
          name={userName}
          email={userEmail}
          initials={initials}
          collapsed={collapsed}
        />
      </div>
    </motion.aside>
  );
}
