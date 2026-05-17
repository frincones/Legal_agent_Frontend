'use client';

/**
 * Assistant sidebar store — unified voice + chat state.
 *
 * Owns:
 *  - sidebar expansion + width (persisted per user via subscribe to localStorage)
 *  - active mode (idle / chat / voice / thinking / acting / awaiting)
 *  - unified thread (voice + chat in one timeline)
 *  - pending action cards proposed by the agent
 *  - running background task cards
 *  - activity log entries (recent agent actions)
 *  - current page context (route, matter, selection)
 *
 * Does NOT own:
 *  - voice realtime connection state (lives in voice-store.ts) — we subscribe
 *  - canvas content (lives in canvas-store.ts) — we observe via ui.command bus
 *  - matter list / case data (RSC fetchers + Supabase realtime)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  ASSISTANT_DEFAULTS,
  type ActionCardData,
  type ActivityItem,
  type AssistantPreferences,
  type Message,
  type PageContext,
  type SidebarMode,
  type TaskCardData,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from '@/lib/assistant/types';

const STORAGE_KEY = 'lexai.assistant.prefs.v1';
const MAX_THREAD_MESSAGES = 200;
const MAX_ACTIVITY_ITEMS = 100;

interface AssistantState {
  // ---------- UI state ----------
  isExpanded: boolean;
  expandedWidth: number;
  mode: SidebarMode;

  // ---------- Conversation ----------
  thread: Message[];
  /** When mode === 'voice', the live partial transcript before commit. */
  partialTranscript: string;

  // ---------- Agent activity ----------
  pendingActions: ActionCardData[];
  runningTasks: TaskCardData[];
  activityLog: ActivityItem[];

  // ---------- Context ----------
  context: PageContext | null;

  // ---------- Preferences (mirrored to localStorage) ----------
  prefs: AssistantPreferences;
  /** Loaded flag — prevents flash of default state on hydration. */
  prefsHydrated: boolean;

  // ---------- Actions ----------
  setExpanded: (open: boolean) => void;
  toggleExpanded: () => void;
  setExpandedWidth: (px: number) => void;
  setMode: (mode: SidebarMode) => void;
  pushMessage: (msg: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  updatePartialTranscript: (text: string) => void;
  commitPartialAsMessage: (channel: 'voice' | 'chat') => void;
  clearThread: () => void;
  pushAction: (action: ActionCardData) => void;
  updateAction: (id: string, patch: Partial<ActionCardData>) => void;
  dismissAction: (id: string) => void;
  pushTask: (task: TaskCardData) => void;
  updateTask: (id: string, patch: Partial<TaskCardData>) => void;
  removeTask: (id: string) => void;
  pushActivity: (item: ActivityItem) => void;
  setContext: (ctx: PageContext) => void;
  hydratePrefs: () => void;
  bumpNudgeDismiss: (key: string) => void;
  markOnboardingSeen: () => void;
}

const clampWidth = (px: number) =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, px));

const loadPrefs = (): AssistantPreferences => {
  if (typeof window === 'undefined') return ASSISTANT_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return ASSISTANT_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AssistantPreferences>;
    return {
      isExpanded: parsed.isExpanded ?? ASSISTANT_DEFAULTS.isExpanded,
      expandedWidth: clampWidth(parsed.expandedWidth ?? ASSISTANT_DEFAULTS.expandedWidth),
      onboardingSeen: parsed.onboardingSeen ?? ASSISTANT_DEFAULTS.onboardingSeen,
      nudgeDismissCounts: parsed.nudgeDismissCounts ?? {},
    };
  } catch {
    return ASSISTANT_DEFAULTS;
  }
};

const persistPrefs = (prefs: AssistantPreferences) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage may be unavailable (private mode, quota). Silently skip.
  }
};

export const useAssistantStore = create<AssistantState>()(
  subscribeWithSelector((set, get) => ({
    isExpanded: false,
    expandedWidth: ASSISTANT_DEFAULTS.expandedWidth,
    mode: 'idle',
    thread: [],
    partialTranscript: '',
    pendingActions: [],
    runningTasks: [],
    activityLog: [],
    context: null,
    prefs: ASSISTANT_DEFAULTS,
    prefsHydrated: false,

    setExpanded: (open) => {
      set((s) => {
        const prefs = { ...s.prefs, isExpanded: open };
        persistPrefs(prefs);
        return { isExpanded: open, prefs };
      });
    },

    toggleExpanded: () => {
      const next = !get().isExpanded;
      get().setExpanded(next);
    },

    setExpandedWidth: (px) => {
      const clamped = clampWidth(px);
      set((s) => {
        const prefs = { ...s.prefs, expandedWidth: clamped };
        persistPrefs(prefs);
        return { expandedWidth: clamped, prefs };
      });
    },

    setMode: (mode) => set({ mode }),

    pushMessage: (msg) =>
      set((s) => {
        const next = [...s.thread, msg];
        // Cap the in-memory thread; UI shows scroll, history persists server-side.
        if (next.length > MAX_THREAD_MESSAGES) {
          next.splice(0, next.length - MAX_THREAD_MESSAGES);
        }
        return { thread: next };
      }),

    updateMessage: (id, patch) =>
      set((s) => ({
        thread: s.thread.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      })),

    updatePartialTranscript: (text) => set({ partialTranscript: text }),

    commitPartialAsMessage: (channel) => {
      const partial = get().partialTranscript.trim();
      if (!partial) return;
      const msg: Message = {
        id: `${channel}-${Date.now()}`,
        role: 'user',
        channel,
        content: partial,
        createdAt: Date.now(),
      };
      set((s) => ({
        partialTranscript: '',
        thread: [...s.thread, msg],
      }));
    },

    clearThread: () => set({ thread: [], partialTranscript: '' }),

    pushAction: (action) =>
      set((s) => ({ pendingActions: [...s.pendingActions, action] })),

    updateAction: (id, patch) =>
      set((s) => ({
        pendingActions: s.pendingActions.map((a) =>
          a.id === id ? { ...a, ...patch } : a,
        ),
      })),

    dismissAction: (id) =>
      set((s) => ({
        pendingActions: s.pendingActions.map((a) =>
          a.id === id ? { ...a, status: 'dismissed' } : a,
        ),
      })),

    pushTask: (task) =>
      set((s) => ({ runningTasks: [...s.runningTasks, task] })),

    updateTask: (id, patch) =>
      set((s) => ({
        runningTasks: s.runningTasks.map((t) =>
          t.id === id ? { ...t, ...patch } : t,
        ),
      })),

    removeTask: (id) =>
      set((s) => ({ runningTasks: s.runningTasks.filter((t) => t.id !== id) })),

    pushActivity: (item) =>
      set((s) => {
        const next = [item, ...s.activityLog];
        if (next.length > MAX_ACTIVITY_ITEMS) {
          next.length = MAX_ACTIVITY_ITEMS;
        }
        return { activityLog: next };
      }),

    setContext: (ctx) => set({ context: ctx }),

    hydratePrefs: () => {
      const prefs = loadPrefs();
      set({
        prefs,
        prefsHydrated: true,
        isExpanded: prefs.isExpanded,
        expandedWidth: prefs.expandedWidth,
      });
    },

    bumpNudgeDismiss: (key) => {
      set((s) => {
        const counts = { ...s.prefs.nudgeDismissCounts };
        counts[key] = (counts[key] ?? 0) + 1;
        const prefs = { ...s.prefs, nudgeDismissCounts: counts };
        persistPrefs(prefs);
        return { prefs };
      });
    },

    markOnboardingSeen: () => {
      set((s) => {
        const prefs = { ...s.prefs, onboardingSeen: true };
        persistPrefs(prefs);
        return { prefs };
      });
    },
  })),
);

/** Selector helpers (kept outside the store so they're tree-shakeable). */
export const selectIsExpanded = (s: AssistantState) => s.isExpanded;
export const selectMode = (s: AssistantState) => s.mode;
export const selectContext = (s: AssistantState) => s.context;
export const selectThread = (s: AssistantState) => s.thread;
export const selectPendingActions = (s: AssistantState) =>
  s.pendingActions.filter((a) => a.status === 'proposed' || a.status === 'executing');
export const selectRunningTasks = (s: AssistantState) =>
  s.runningTasks.filter((t) => t.status === 'running' || t.status === 'paused');
