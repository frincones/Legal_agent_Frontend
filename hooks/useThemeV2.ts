'use client';

/**
 * F6-T03 · LexAI UX v2 — useThemeV2
 *
 * Gestiona el modo de color (light / dark / system) para la UI v2.
 * Persiste la elección en localStorage (key: lexai-v2-theme).
 * Solo aplica el atributo data-theme al <html> cuando
 * NEXT_PUBLIC_UX_V2_DARK=true está activo.
 *
 * Ciclo: light → dark → system → light (via ThemeToggle).
 *
 * Uso:
 *   const { theme, resolvedTheme, setTheme } = useThemeV2();
 */
import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const LS_KEY = 'lexai-v2-theme';

export function useThemeV2() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Leer preferencia almacenada (solo en el cliente)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeState(stored);
      }
    } catch {
      /* ignore — localStorage no disponible (SSR, incognito) */
    }
  }, []);

  // Aplicar tema al documento
  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_UX_V2_DARK === 'true';
    if (!enabled) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const resolve = (): 'light' | 'dark' => {
      if (theme === 'system') return mq.matches ? 'dark' : 'light';
      return theme;
    };

    const apply = () => {
      const r = resolve();
      setResolvedTheme(r);
      document.documentElement.setAttribute('data-theme', r);
    };

    apply();

    if (theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(LS_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, resolvedTheme, setTheme };
}
