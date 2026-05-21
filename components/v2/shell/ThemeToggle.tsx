'use client';

/**
 * F6-T04 · LexAI UX v2 — ThemeToggle
 *
 * Botón ghost que cicla entre light → dark → system → light.
 * Icono dinámico con AnimatePresence framer-motion.
 * Solo se renderiza cuando NEXT_PUBLIC_UX_V2_DARK=true.
 *
 * Uso en SidebarV2 footer y SidebarUserMenu:
 *   <ThemeToggle />
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useThemeV2, type Theme } from '@/hooks/useThemeV2';
import { useReducedMotion } from '@/hooks/v2/useReducedMotion';

const CYCLE: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const LABEL: Record<Theme, string> = {
  light: 'Modo claro',
  dark: 'Modo oscuro',
  system: 'Seguir sistema',
};

const NEXT_LABEL: Record<Theme, string> = {
  light: 'Cambiar a oscuro',
  dark: 'Seguir sistema',
  system: 'Cambiar a claro',
};

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') return <Moon size={15} strokeWidth={1.8} aria-hidden />;
  if (theme === 'light') return <Sun size={15} strokeWidth={1.8} aria-hidden />;
  return <Monitor size={15} strokeWidth={1.8} aria-hidden />;
}

interface ThemeToggleProps {
  /** Cuando collapsed=true muestra solo el icono (igual que SidebarItemV2) */
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const enabled = process.env.NEXT_PUBLIC_UX_V2_DARK === 'true';
  const { theme, setTheme } = useThemeV2();
  const reduced = useReducedMotion();

  if (!enabled) return null;

  const handleClick = () => setTheme(CYCLE[theme]);

  const button = (
    <button
      type="button"
      onClick={handleClick}
      aria-label={NEXT_LABEL[theme]}
      title={`${LABEL[theme]} · ${NEXT_LABEL[theme]}`}
      className={[
        'flex items-center gap-[10px] rounded-lg transition-colors duration-150',
        'text-[var(--v2-text-tertiary,#6E6C64)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] hover:text-[var(--v2-text-primary,#1A1916)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-2',
        collapsed ? 'h-10 w-10 justify-center p-0' : 'px-[10px] py-[8px] w-full',
      ].join(' ')}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={reduced ? {} : { opacity: 0, scale: 0.7, rotate: -30 }}
          animate={reduced ? {} : { opacity: 1, scale: 1, rotate: 0 }}
          exit={reduced ? {} : { opacity: 0, scale: 0.7, rotate: 30 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="flex shrink-0 items-center justify-center"
        >
          <ThemeIcon theme={theme} />
        </motion.span>
      </AnimatePresence>

      {!collapsed && (
        <span className="flex-1 min-w-0 truncate text-[13px] font-medium leading-none text-left">
          {LABEL[theme]}
        </span>
      )}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-md bg-[var(--v2-text-primary,#1A1916)] px-[10px] py-[6px] text-[12px] font-medium text-[var(--v2-text-inverse,#FAFAF7)] shadow-lg"
          >
            {LABEL[theme]}
            <Tooltip.Arrow className="fill-[var(--v2-text-primary,#1A1916)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
