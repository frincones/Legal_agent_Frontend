'use client';

import { useEffect } from 'react';

export type ShortcutHandlers = Partial<{
  exportDocx: () => void;
  newDictation: () => void;
  searchPalette: () => void;
}>;

/** Global keyboard shortcuts:
 *  - ⌘E / Ctrl+E → exportDocx
 *  - ⌘D / Ctrl+D → newDictation (overrides browser bookmark, by design)
 *  - ⌘K / Ctrl+K → searchPalette (already wired in CommandPalette)
 */
export function useGlobalShortcuts(handlers: ShortcutHandlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;

      if (e.key.toLowerCase() === 'e' && handlers.exportDocx) {
        e.preventDefault();
        handlers.exportDocx();
      } else if (e.key.toLowerCase() === 'd' && handlers.newDictation) {
        e.preventDefault();
        handlers.newDictation();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
