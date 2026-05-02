'use client';

import { create } from 'zustand';

interface UIStore {
  /** Mobile drawer state for the left sidebar. Desktop ignores this. */
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((p) => ({ sidebarOpen: !p.sidebarOpen })),
}));
