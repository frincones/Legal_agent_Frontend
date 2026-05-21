'use client';

/**
 * F1-T10 · LexAI UX v2 — useGlobalHotkeys
 *
 * Registra atajos globales de teclado cuando NEXT_PUBLIC_UX_V2_SHELL=true.
 *
 * Atajos registrados:
 *   Cmd+K / Ctrl+K  → abre CommandPaletteV2 (dispara evento 'v2:cmd-k')
 *   Cmd+N / Ctrl+N  → nuevo caso → /casos/nuevo
 *   Cmd+D / Ctrl+D  → nuevo dictado (dispara 'v2:voice-start')
 *   Cmd+L / Ctrl+L  → live canvas → /canvas
 *   Cmd+B / Ctrl+B  → toggle sidebar (manejado en SidebarToggle)
 *
 * Nota: Cmd+K y Cmd+B también son manejados localmente en CommandPaletteV2
 * y SidebarToggle respectivamente. Este hook sirve como registro centralizado
 * y evita conflictos con el palette legacy (CommandPalette.tsx) cuando el
 * flag está ON.
 *
 * Uso:
 *   // En el layout de la app (client component):
 *   const V2_SHELL = process.env.NEXT_PUBLIC_UX_V2_SHELL === 'true';
 *   if (V2_SHELL) useGlobalHotkeys();
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const UX_V2_SHELL = process.env.NEXT_PUBLIC_UX_V2_SHELL === 'true';

export function useGlobalHotkeys() {
  const router = useRouter();

  useEffect(() => {
    // Solo activar cuando el flag está ON
    if (!UX_V2_SHELL) return;

    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'k':
          // Cmd+K → CommandPaletteV2 la escucha directamente.
          // No hacer nada aquí para no duplicar el toggle.
          // El evento 'v2:cmd-k' existe por si otros componentes necesitan saberlo.
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('v2:cmd-k'));
          break;

        case 'n':
          // Cmd+N → Nuevo caso
          // Solo interceptar si no hay input/textarea enfocado
          if (!isInputFocused()) {
            e.preventDefault();
            router.push('/casos/nuevo');
          }
          break;

        case 'd':
          // Cmd+D → Nuevo dictado
          if (!isInputFocused()) {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('v2:voice-start'));
          }
          break;

        case 'l':
          // Cmd+L → Live canvas
          if (!isInputFocused()) {
            e.preventDefault();
            router.push('/canvas');
          }
          break;

        // Cmd+B es manejado por SidebarToggle directamente
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);
}

/** Verifica si el foco está en un input/textarea para no interceptar
 *  atajos mientras el usuario escribe. */
function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}
