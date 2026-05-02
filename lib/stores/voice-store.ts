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

  setState: (s) => set({ state: s }),
  setTranscript: (t) => set({ transcript: t, partialTranscript: '' }),
  setPartial: (t) => set({ partialTranscript: t }),
  appendAnswer: (delta) => set((p) => ({ answerText: p.answerText + delta })),
  resetAnswer: () => set({ answerText: '' }),
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
  reset: () =>
    set({
      state: 'idle',
      transcript: '',
      partialTranscript: '',
      answerText: '',
      caption: '',
      tools: [],
      bargeins: 0,
      ttfaMs: null,
      e2eMs: null,
    }),
}));
