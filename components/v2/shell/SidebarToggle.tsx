'use client';

/**
 * F1-T06 · LexAI UX v2 — SidebarToggle
 *
 * Botón pequeño que colapsa/expande el SidebarV2.
 * Persiste el estado en localStorage (key: lexai-v2-sidebar-collapsed).
 * Atajo de teclado: Ctrl+B / Cmd+B.
 */
import { useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const LS_KEY = 'lexai-v2-sidebar-collapsed';

interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  // Ctrl+B / Cmd+B hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggle]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
      title={collapsed ? 'Expandir (Ctrl+B)' : 'Colapsar (Ctrl+B)'}
      className="flex h-[28px] w-[28px] items-center justify-center rounded-md text-[var(--v2-text-tertiary,#6E6C64)] transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)] hover:text-[var(--v2-text-primary,#1A1916)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-2"
    >
      {collapsed ? (
        <PanelLeftOpen size={15} strokeWidth={1.8} />
      ) : (
        <PanelLeftClose size={15} strokeWidth={1.8} />
      )}
    </button>
  );
}

/** Utility: lee el estado inicial de localStorage (SSR-safe). */
export function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LS_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Utility: persiste el estado en localStorage. */
export function writeSidebarCollapsed(value: boolean): void {
  try {
    localStorage.setItem(LS_KEY, String(value));
  } catch {
    /* ignore */
  }
}
