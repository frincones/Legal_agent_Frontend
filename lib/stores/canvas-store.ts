'use client';

import { create } from 'zustand';

/**
 * Canvas store — minimal pub/sub between the TipTap editor and side
 * panels (citations sidebar, pre-flight validator, future widgets).
 *
 * Why a store rather than props/context:
 * - The editor lives deep inside CanvasMain → CanvasEditor.
 * - Multiple sibling panels (sidebar, pre-flight, suma generator) will
 *   need to read the latest content without prop-drilling.
 * - Zustand is already a dependency and we use it in voice-store.
 *
 * Performance: setMarkdown is throttled at the call site (in
 * CanvasEditor) to avoid re-render storms while the user types.
 */

interface CanvasStore {
  documentId: string | null;
  /** Latest markdown of the editor (debounced from CanvasEditor). */
  markdown: string;
  /** Bumps every time markdown changes — useful for effect deps. */
  contentVersion: number;
  setDocumentId: (id: string | null) => void;
  setMarkdown: (md: string) => void;
  reset: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  documentId: null,
  markdown: '',
  contentVersion: 0,
  setDocumentId: (id) => set({ documentId: id }),
  setMarkdown: (md) =>
    set((s) => ({ markdown: md, contentVersion: s.contentVersion + 1 })),
  reset: () => set({ documentId: null, markdown: '', contentVersion: 0 }),
}));
