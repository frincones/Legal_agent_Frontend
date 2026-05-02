'use client';

import { create } from 'zustand';

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'tool'
  | 'speaking'
  | 'awaiting';

export type ToolCallSnapshot = {
  id: string;
  name: string;
  status: 'started' | 'finished' | 'error';
  preview?: unknown;
  ms?: number;
};

export type ConversationTurn = {
  ts: number;
  role: 'user' | 'assistant';
  text: string;
};

interface VoiceStore {
  state: VoiceState;
  transcript: string;
  partialTranscript: string;
  answerText: string;
  caption: string;
  ttfaMs: number | null;
  e2eMs: number | null;
  bargeins: number;
  tools: ToolCallSnapshot[];
  matterId: string | null;
  /** Historial de turnos completos (transcripción + respuestas finalizadas). */
  history: ConversationTurn[];
  /** Bloquea pttDown sin desconectar la sesión. */
  paused: boolean;
  /** Suprime audio output (sólo texto). */
  silentMode: boolean;

  setState: (s: VoiceState) => void;
  setTranscript: (t: string) => void;
  setPartial: (t: string) => void;
  appendAnswer: (delta: string) => void;
  resetAnswer: () => void;
  pushTool: (t: ToolCallSnapshot) => void;
  resetTools: () => void;
  bumpBargein: () => void;
  setCaption: (c: string) => void;
  setMatter: (m: string | null) => void;
  pushHistory: (turn: ConversationTurn) => void;
  setPaused: (v: boolean) => void;
  setSilentMode: (v: boolean) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  state: 'idle',
  transcript: '',
  partialTranscript: '',
  answerText: '',
  caption: '',
  ttfaMs: null,
  e2eMs: null,
  bargeins: 0,
  tools: [],
  matterId: null,
  history: [],
  paused: false,
  silentMode: false,

  setState: (s) => set({ state: s }),
  setTranscript: (t) => set((p) => ({
    transcript: t,
    partialTranscript: '',
    history: t ? [...p.history, { ts: Date.now(), role: 'user', text: t }] : p.history,
  })),
  setPartial: (t) => set({ partialTranscript: t }),
  appendAnswer: (delta) => set((p) => ({ answerText: p.answerText + delta })),
  resetAnswer: () => set((p) => {
    const text = p.answerText.trim();
    if (!text) return { answerText: '' };
    return {
      answerText: '',
      history: [...p.history, { ts: Date.now(), role: 'assistant', text }],
    };
  }),
  pushTool: (t) =>
    set((p) => {
      const idx = p.tools.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        const next = [...p.tools];
        next[idx] = { ...next[idx], ...t };
        return { tools: next };
      }
      return { tools: [...p.tools, t] };
    }),
  resetTools: () => set({ tools: [] }),
  bumpBargein: () => set((p) => ({ bargeins: p.bargeins + 1 })),
  setCaption: (c) => set({ caption: c }),
  setMatter: (m) => set({ matterId: m }),
  pushHistory: (turn) => set((p) => ({ history: [...p.history, turn] })),
  setPaused: (v) => set({ paused: v }),
  setSilentMode: (v) => set({ silentMode: v }),
  reset: () =>
    set({
      state: 'idle',
      transcript: '',
      partialTranscript: '',
      answerText: '',
      caption: '',
      tools: [],
      history: [],
      bargeins: 0,
      ttfaMs: null,
      e2eMs: null,
    }),
}));
