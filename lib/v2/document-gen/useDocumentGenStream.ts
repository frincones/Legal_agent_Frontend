/**
 * lib/v2/document-gen/useDocumentGenStream.ts
 *
 * Hook que consume el SSE de POST /v1/documents/generate (proxy via
 * /api/documents/generate).
 *
 * Eventos SSE esperados del backend:
 *   meta                  → { generation_id, template_selected, sections_plan }
 *   section_started       → { section_key, section_title, section_order, total }
 *   section_delta         → { section_key, text }
 *   section_done          → { section_key, content_md, critic_score, citations }
 *   verification_progress → { checked, total, found, suspicious }
 *   verification_done     → { citation_rate, verified, suspicious, not_found }
 *   quality_score         → { judge_score, dimensions, issues }
 *   done                  → { generation_id, matter_document_id, total_seconds }
 *   error                 → { stage, message }
 *
 * Estado expuesto:
 *   { status, sections, currentSection, citations, qualityScore,
 *     generationId, matterDocumentId, error, start, abort }
 */

import { useCallback, useRef, useState } from 'react';

export type GenStatus =
  | 'idle'
  | 'starting'
  | 'planning'
  | 'streaming'
  | 'verifying'
  | 'scoring'
  | 'done'
  | 'error'
  | 'aborted';

export interface SectionState {
  section_key: string;
  section_title: string;
  section_order: number;
  status: 'pending' | 'streaming' | 'done' | 'error';
  content_md: string;
  critic_score?: number;
  citation_refs?: string[];
}

export interface CitationStatus {
  ref: string;
  status: 'verified' | 'suspicious' | 'not_found' | 'pending';
}

export interface QualityScore {
  judge_score: number;
  dimensions: Record<string, number>;
  issues: string[];
}

export interface GenStreamState {
  status: GenStatus;
  generationId: string | null;
  templateSelected: { id: string; name: string; quality_score: number } | null;
  sectionsPlan: Array<{ key: string; title: string; required: boolean }>;
  sections: Record<string, SectionState>;
  currentSectionKey: string | null;
  citations: CitationStatus[];
  citationRate: number | null;
  qualityScore: QualityScore | null;
  matterDocumentId: string | null;
  error: string | null;
  totalSeconds: number | null;
}

export interface GenerateParams {
  intent: string;
  user_brief: string;
  matter_id?: string | null;
  materia?: string | null;
  doc_type?: string | null;
  context?: Record<string, unknown>;
}

const INITIAL_STATE: GenStreamState = {
  status: 'idle',
  generationId: null,
  templateSelected: null,
  sectionsPlan: [],
  sections: {},
  currentSectionKey: null,
  citations: [],
  citationRate: null,
  qualityScore: null,
  matterDocumentId: null,
  error: null,
  totalSeconds: null,
};

export function useDocumentGenStream() {
  const [state, setState] = useState<GenStreamState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, status: 'aborted' }));
  }, []);

  const start = useCallback(async (params: GenerateParams) => {
    reset();
    const ac = new AbortController();
    abortRef.current = ac;
    setState((s) => ({ ...s, status: 'starting' }));

    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!ac.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE: parsea bloques separados por \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const lines = part.split('\n');
          let eventName = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
          }
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            handleEvent(eventName, data);
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, status: 'error', error: msg }));
    }

    function handleEvent(eventName: string, data: Record<string, unknown>) {
      switch (eventName) {
        case 'meta':
          setState((s) => ({
            ...s,
            status: 'planning',
            generationId: data['generation_id'] as string,
            templateSelected: data['template_selected'] as GenStreamState['templateSelected'],
            sectionsPlan: (data['sections_plan'] ?? []) as GenStreamState['sectionsPlan'],
          }));
          break;
        case 'section_started':
          setState((s) => ({
            ...s,
            status: 'streaming',
            currentSectionKey: data['section_key'] as string,
            sections: {
              ...s.sections,
              [data['section_key'] as string]: {
                section_key: data['section_key'] as string,
                section_title: data['section_title'] as string,
                section_order: data['section_order'] as number,
                status: 'streaming',
                content_md: '',
              },
            },
          }));
          break;
        case 'section_delta':
          setState((s) => {
            const key = data['section_key'] as string;
            const text = data['text'] as string;
            const current = s.sections[key];
            if (!current) return s;
            return {
              ...s,
              sections: {
                ...s.sections,
                [key]: { ...current, content_md: current.content_md + text },
              },
            };
          });
          break;
        case 'section_done':
          setState((s) => {
            const key = data['section_key'] as string;
            const current = s.sections[key];
            if (!current) return s;
            return {
              ...s,
              sections: {
                ...s.sections,
                [key]: {
                  ...current,
                  status: 'done',
                  content_md: (data['content_md'] as string) ?? current.content_md,
                  critic_score: data['critic_score'] as number | undefined,
                  citation_refs: (data['citation_refs'] ?? []) as string[],
                },
              },
            };
          });
          break;
        case 'verification_progress':
          setState((s) => ({ ...s, status: 'verifying' }));
          break;
        case 'verification_done':
          setState((s) => ({
            ...s,
            status: 'scoring',
            citationRate: (data['citation_rate'] as number) ?? null,
            citations: [
              ...((data['verified'] ?? []) as string[]).map((ref) => ({ ref, status: 'verified' as const })),
              ...((data['suspicious'] ?? []) as string[]).map((ref) => ({ ref, status: 'suspicious' as const })),
              ...((data['not_found'] ?? []) as string[]).map((ref) => ({ ref, status: 'not_found' as const })),
            ],
          }));
          break;
        case 'quality_score':
          setState((s) => ({
            ...s,
            qualityScore: {
              judge_score: data['judge_score'] as number,
              dimensions: (data['dimensions'] ?? {}) as Record<string, number>,
              issues: (data['issues'] ?? []) as string[],
            },
          }));
          break;
        case 'done':
          setState((s) => ({
            ...s,
            status: 'done',
            matterDocumentId: (data['matter_document_id'] as string) ?? null,
            totalSeconds: (data['total_seconds'] as number) ?? null,
          }));
          break;
        case 'error':
          setState((s) => ({
            ...s,
            status: 'error',
            error: (data['message'] as string) ?? 'Error desconocido',
          }));
          break;
      }
    }
  }, [reset]);

  return { state, start, abort, reset };
}
