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
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Folder,
  FileText,
  Calendar,
  Sparkles,
  PenSquare,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
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
  const router = useRouter();
  // collapsed comienza siempre en false (expandido).
  // El useEffect posterior lee localStorage: si el usuario lo colapsó antes,
  // se respeta; si no hay valor, queda en false (expandido).
  const [collapsed, setCollapsed] = useState(false);

  /**
   * Inicia una conversación nueva:
   *  1) Limpia el thread persistido en localStorage para que el composer
   *     arranque vacío al montar.
   *  2) Navega a /v2/inicio (forzando reload si ya estamos ahí, para que
   *     ComposerV2WithStream re-lea el storage vacío y se resetee).
   */
  const handleNewChat = () => {
    try {
      // Limpiar el thread principal (sin matter)
      localStorage.removeItem('lexai-v2-current-thread');
      // Disparar evento para que cualquier ComposerV2WithStream montado se resetee
      window.dispatchEvent(new CustomEvent('lexai:new-thread'));
    } catch {
      /* noop */
    }
    if (pathname?.startsWith('/v2/inicio') || pathname?.startsWith('/inicio')) {
      // Ya estamos en inicio — refrescar para resetear el state local del composer
      router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/v2/inicio');
    }
  };

  // Leer estado inicial desde localStorage (solo en el cliente).
  // Si nunca se guardó un valor, readSidebarCollapsed() retorna false → expandido.
  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  // Auto-colapso solo en breakpoint tablet (768-1024px) para no desperdiciar espacio.
  // En desktop (≥1024px) siempre se respeta la preferencia del usuario.
  // En mobile (<768px) el sidebar es un drawer y collapsed no aplica.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Solo colapsa automáticamente si el usuario NO ha guardado una preferencia explícita
      const hasExplicitPref = localStorage.getItem('lexai-v2-sidebar-collapsed') !== null;
      if (!hasExplicitPref && e.matches) {
        setCollapsed(true);
      } else if (!hasExplicitPref && !e.matches) {
        setCollapsed(false);
      }
    };
    handleChange(mq);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
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
      className="relative flex h-full min-h-0 flex-col border-r border-[var(--v2-border-subtle,#E8E7E1)] bg-[var(--v2-bg-base,#FAFAF7)]"
      aria-label="Barra lateral principal"
    >
      {/* ── Header: Logo + Nombre firm (solo expandido) / Toggle solo (colapsado) ── */}
      <div
        className={[
          'flex items-center border-b border-[var(--v2-border-subtle,#E8E7E1)] py-3',
          collapsed ? 'justify-center px-2' : 'px-3',
        ].join(' ')}
        style={{ minHeight: '52px' }}
      >
        {!collapsed ? (
          <>
            {/* Logo LexAI — solo visible en expandido */}
            <span
              aria-label="LexAI"
              className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, var(--v2-brand-navy,#0E2A5E), var(--v2-accent-copper,#B8763C))',
              }}
            >
              L
            </span>
            <div className="min-w-0 flex-1 ml-2">
              <div className="truncate text-[12px] font-semibold text-[var(--v2-brand-navy,#0E2A5E)] leading-none">
                LexAI
              </div>
              <div className="truncate text-[10.5px] text-[var(--v2-text-tertiary,#807E76)] mt-[2px]">
                {firmName}
              </div>
            </div>
            <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
          </>
        ) : (
          /* Colapsado: SOLO el toggle centrado — el logo se oculta para evitar el doble icono */
          <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
        )}
      </div>

      {/* ── Botón Nueva conversación — prominente, justo bajo el header ── */}
      <div className={collapsed ? 'flex justify-center px-2 pt-3 pb-2' : 'px-3 pt-3 pb-2'}>
        {collapsed ? (
          <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={handleNewChat}
                  aria-label="Nueva conversación"
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: 'var(--v2-brand-navy,#0E2A5E)',
                    color: '#fff',
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy-hover,#0a2049)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy,#0E2A5E)';
                  }}
                >
                  <PenSquare size={16} strokeWidth={1.9} aria-hidden />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="z-50 rounded-md bg-[var(--v2-text-primary,#1A1916)] px-[10px] py-[6px] text-[12px] font-medium text-[var(--v2-text-inverse,#FAFAF7)] shadow-lg"
                >
                  Nueva conversación
                  <Tooltip.Arrow className="fill-[var(--v2-text-primary,#1A1916)]" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ) : (
          <button
            type="button"
            onClick={handleNewChat}
            aria-label="Iniciar nueva conversación"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: 'var(--v2-brand-navy,#0E2A5E)',
              color: '#fff',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy-hover,#0a2049)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy,#0E2A5E)';
            }}
          >
            <PenSquare size={15} strokeWidth={1.9} aria-hidden />
            <span className="leading-none">Nueva conversación</span>
          </button>
        )}
      </div>

      {/* ── Cuerpo scrollable ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-2">

        {/* Sección: Navegación principal (5 items).
            gap-0.5 (2px) entre items del mismo grupo — relacionados entre sí. */}
        <nav
          aria-label="Navegación principal"
          className={['flex flex-col gap-0.5', collapsed ? 'items-center px-2' : 'px-2'].join(' ')}
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

        {/* Separador — gap-6 (24px) entre grupos distintos */}
        <div className="my-2 border-t border-[var(--v2-border-subtle,#E8E7E1)]" />

        {/* Sección: Mis hilos (oculta en colapsado) */}
        {!collapsed && (
          <>
            {/* Label de sección con gap-4 antes del primer item */}
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Mis hilos
            </div>
            <div className="px-2">
              <SidebarHilosList collapsed={collapsed} />
            </div>

            {/* Separador entre secciones */}
            <div className="my-2 border-t border-[var(--v2-border-subtle,#E8E7E1)]" />

            {/* Sección: Plantillas y Skills */}
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Plantillas y Skills
            </div>
            <div className="px-2">
              <SidebarSkillsList collapsed={collapsed} />
            </div>
          </>
        )}
      </div>

      {/* ── Footer: ThemeToggle + Usuario ── gap-1 entre elementos del footer */}
      <div
        className={[
          'border-t border-[var(--v2-border-subtle,#E8E7E1)] px-2 py-2 flex flex-col gap-1',
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
