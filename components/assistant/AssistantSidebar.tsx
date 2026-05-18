'use client';

/**
 * AssistantSidebar — orchestrator of the right-side AI sidebar.
 *
 * Decisions confirmed (U1-U8, V1-V8):
 *   U1 push ≥1280 / overlay 768-1280 / bottom-sheet <768
 *   U2 ActivityTimeline = secondary collapsible tab
 *   U3 voice orb persistent floating on mobile
 *   U6 expansion state per user (localStorage)
 *   U7 no auto-expand on matter open
 *   U8 resize drag with persisted width
 *   V8 voice + chat unified — mic toggle uses existing VoiceProvider
 *
 * Feature flag: NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED gates the mount in
 * app/(app)/layout.tsx (see README.md). This component renders only when
 * mounted.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAssistantStore } from '@/lib/stores/assistant-store';
import {
  BREAKPOINT_BOTTOM_SHEET_PX,
  BREAKPOINT_PUSH_PX,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_RAIL_WIDTH,
} from '@/lib/assistant/types';
import {
  parseUserMessage,
  runSkillStream,
} from '@/lib/assistant/skill-runner';
import { useVoice } from '@/components/voice/VoiceProvider';
import { useCanvasStore } from '@/lib/stores/canvas-store';

import { AssistantRail } from './AssistantRail';
import { AssistantHeader } from './AssistantHeader';
import { AssistantThread } from './AssistantThread';
import { AssistantComposer } from './AssistantComposer';
import { ActivityTimeline } from './ActivityTimeline';
import { VoiceOrb } from './VoiceOrb';

const BODY_PADDING_VAR = '--lexai-assistant-pad-right';

type ViewportMode = 'push' | 'overlay' | 'bottom-sheet';

function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>('push');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const compute = () => {
      const w = window.innerWidth;
      if (w < BREAKPOINT_BOTTOM_SHEET_PX) setMode('bottom-sheet');
      else if (w < BREAKPOINT_PUSH_PX) setMode('overlay');
      else setMode('push');
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return mode;
}

export function AssistantSidebar() {
  const isExpanded = useAssistantStore((s) => s.isExpanded);
  const expandedWidth = useAssistantStore((s) => s.expandedWidth);
  const prefsHydrated = useAssistantStore((s) => s.prefsHydrated);
  const pushMessage = useAssistantStore((s) => s.pushMessage);
  const updateMessage = useAssistantStore((s) => s.updateMessage);
  const setMode = useAssistantStore((s) => s.setMode);
  const setExpanded = useAssistantStore((s) => s.setExpanded);
  const setExpandedWidth = useAssistantStore((s) => s.setExpandedWidth);
  const mode = useAssistantStore((s) => s.mode);
  const context = useAssistantStore((s) => s.context);
  const pushActivity = useAssistantStore((s) => s.pushActivity);

  const viewport = useViewportMode();
  const voice = useVoice();
  const abortRef = useRef<AbortController | null>(null);

  // Body padding effect was removed · the sidebar now ALWAYS overlays
  // instead of pushing the shell. The previous push approach worked on
  // the body width but broke the canvas page's internal layout (which has
  // its own right-side citations panel competing for the same edge).
  // Pattern adopted: Cursor / Notion AI / Spellbook · floating panel.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // Defensive cleanup in case any earlier build left the var set.
    document.body.style.removeProperty(BODY_PADDING_VAR);
  }, []);

  const safeExpanded = prefsHydrated && isExpanded;

  // ------- send handler (Sprint 2 wiring, kept) -------
  const handleSend = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const userMsgId = `u-${Date.now()}`;
      pushMessage({
        id: userMsgId,
        role: 'user',
        channel: 'chat',
        content: text,
        createdAt: Date.now(),
      });
      setMode('thinking');

      const assistantMsgId = `a-${Date.now()}`;
      pushMessage({
        id: assistantMsgId,
        role: 'assistant',
        channel: 'chat',
        content: '',
        createdAt: Date.now(),
      });

      let assistantContent = '';
      let receivedAnyDelta = false;
      const warnings: string[] = [];
      let blockedReason: string | null = null;

      // Snapshot canvas content if user is on a canvas page · auto-attaches
      // the open document so the agent can read/analyze/summarize it.
      const canvasState = useCanvasStore.getState();
      const documentText = canvasState.markdown && canvasState.markdown.trim().length > 50
        ? canvasState.markdown
        : null;

      const params = parseUserMessage(text, {
        matter_id: context?.matterId ?? null,
        matter_titulo: context?.matterMeta?.titulo ?? null,
        document_text: documentText,
        document_id: canvasState.documentId ?? context?.documentId ?? null,
      });

      // Trace data collected as the stream progresses · rendered as a
      // collapsed ThinkingStep header above the assistant message.
      const toolsUsed: string[] = [];
      const contextAttached: string[] = [];
      if (params.input.document_text) {
        const kb = Math.round(
          ((params.input.document_text as string).length / 1024) * 10,
        ) / 10;
        contextAttached.push(`Documento del canvas (${kb} KB)`);
      }
      if (params.matter_id && context?.matterMeta?.titulo) {
        contextAttached.push(`Caso · ${context.matterMeta.titulo}`);
      } else if (params.matter_id) {
        contextAttached.push(`Caso #${params.matter_id.slice(0, 8)}`);
      }

      const updateThinking = (label: string) => {
        updateMessage(assistantMsgId, {
          thinking: {
            label,
            toolsUsed: toolsUsed.length ? [...toolsUsed] : undefined,
            contextAttached: contextAttached.length ? [...contextAttached] : undefined,
          },
        });
      };

      // Seed an initial trace · gets refined as events arrive.
      updateThinking(contextAttached.length > 0 ? 'Leyendo contexto…' : 'Pensando…');

      try {
        for await (const ev of runSkillStream({ ...params, signal: ac.signal })) {
          if (ac.signal.aborted) break;
          switch (ev.event) {
            case 'meta':
              updateThinking(`Ejecutando ${ev.data.name}…`);
              break;
            case 'delta':
              receivedAnyDelta = true;
              assistantContent += ev.data.text;
              updateMessage(assistantMsgId, { content: assistantContent });
              break;
            case 'tool_started':
              if (!toolsUsed.includes(ev.data.name)) {
                toolsUsed.push(ev.data.name);
              }
              updateThinking(`Ejecutando ${ev.data.name}…`);
              setMode('acting');
              pushActivity({
                id: `act-tool-${Date.now()}-${ev.data.name}`,
                ts: new Date().toISOString(),
                kind: 'tool_called',
                label: `Tool ${ev.data.name} (round ${ev.data.round})`,
              });
              break;
            case 'tool_finished':
              setMode('thinking');
              updateThinking(
                toolsUsed.length === 1
                  ? `Usó ${toolsUsed[0]}`
                  : `Usó ${toolsUsed.length} herramientas`,
              );
              break;
            case 'warning':
              warnings.push(`${ev.data.hook}: ${ev.data.reason}`);
              break;
            case 'blocked':
              blockedReason = ev.data?.reason ?? 'blocked';
              break;
            case 'done':
              if (!receivedAnyDelta && ev.data.full_text) {
                assistantContent = ev.data.full_text;
                updateMessage(assistantMsgId, { content: assistantContent });
                receivedAnyDelta = true;
              }
              // Final trace label · summarizes what happened.
              if (toolsUsed.length > 0) {
                updateThinking(
                  toolsUsed.length === 1
                    ? `Usó ${toolsUsed[0]}`
                    : `Usó ${toolsUsed.length} herramientas: ${toolsUsed.slice(0, 3).join(', ')}${toolsUsed.length > 3 ? '…' : ''}`,
                );
              } else if (contextAttached.length > 0) {
                updateThinking('Leyó contexto y respondió');
              } else {
                updateThinking('Respondió');
              }
              break;
            case 'error':
              warnings.push(
                `Error: ${ev.data.error}${ev.data.detail ? ` · ${ev.data.detail}` : ''}`,
              );
              break;
          }
        }
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          warnings.push(`Red: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Finalize the assistant message · tool-run indicators were ephemeral
      // hints during streaming, the activity log keeps the audit trail.
      let finalContent = assistantContent;
      if (blockedReason) {
        finalContent =
          (finalContent ? finalContent + '\n\n' : '') +
          `🚫 Acción bloqueada: ${blockedReason}`;
      }
      if (!receivedAnyDelta && !blockedReason && !ac.signal.aborted) {
        if (toolsUsed.length > 0) {
          finalContent =
            `Ejecuté ${toolsUsed.join(', ')} pero no produje respuesta de texto. ` +
            'Reintenta o reformula la pregunta.';
        } else {
          finalContent =
            params.command === '/ask'
              ? 'No pude generar una respuesta. Prueba con ⌘K para ver los comandos disponibles, ' +
                'o escribe `/` para autocompletar una skill.'
              : `La skill \`${params.command}\` no devolvió contenido o no existe en este despacho.`;
        }
      }
      if (warnings.length) {
        finalContent =
          (finalContent ? finalContent + '\n\n' : '') +
          warnings.map((w) => `⚠️ ${w}`).join('\n');
      }
      // Always update at the end so ephemeral tool spinners get replaced.
      updateMessage(assistantMsgId, { content: finalContent });

      pushActivity({
        id: `act-${Date.now()}`,
        ts: new Date().toISOString(),
        kind: 'message_sent',
        label:
          params.command === '/ask'
            ? 'Pregunta al asistente'
            : `Skill ${params.command}`,
        detail: { matter_id: params.matter_id, command: params.command },
      });

      setMode('idle');
      abortRef.current = null;
    },
    [pushMessage, updateMessage, setMode, pushActivity, context],
  );

  // ------- voice toggle wired to existing VoiceProvider -------
  const handleVoiceToggle = useCallback(async () => {
    try {
      await voice.toggle();
      setMode(mode === 'voice' ? 'idle' : 'voice');
    } catch (e) {
      console.warn('[AssistantSidebar] voice toggle failed:', e);
    }
  }, [voice, setMode, mode]);

  // ------- resize handle (U8) -------
  const [resizing, setResizing] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWRef = useRef(0);

  const onResizeMove = useCallback(
    (e: MouseEvent) => {
      const dx = resizeStartXRef.current - e.clientX;
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, resizeStartWRef.current + dx),
      );
      setExpandedWidth(next);
    },
    [setExpandedWidth],
  );

  const onResizeEnd = useCallback(() => {
    setResizing(false);
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', onResizeEnd);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, [onResizeMove]);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeStartXRef.current = e.clientX;
      resizeStartWRef.current = expandedWidth;
      setResizing(true);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', onResizeEnd);
    },
    [expandedWidth, onResizeMove, onResizeEnd],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeEnd);
    };
  }, [onResizeMove, onResizeEnd]);

  // ------- layout calculations -------
  const expandedPanel = useMemo(() => {
    if (!safeExpanded) return null;

    return (
      <section
        style={{ width: viewport === 'bottom-sheet' ? '100%' : expandedWidth }}
        className={[
          'border-line bg-bg flex h-full flex-col',
          viewport === 'bottom-sheet' ? 'border-t' : 'border-l',
          'shadow-2',
          resizing ? '' : 'transition-[width] duration-200 ease-out',
        ].join(' ')}
        aria-label="Panel expandido del asistente"
      >
        {viewport !== 'bottom-sheet' && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar sidebar"
            onMouseDown={onResizeStart}
            className={[
              'absolute -left-1 top-0 z-10 h-full w-2 cursor-ew-resize',
              'hover:bg-accent/30 transition-colors',
              resizing ? 'bg-accent/40' : 'bg-transparent',
            ].join(' ')}
          />
        )}
        <AssistantHeader onVoiceToggle={handleVoiceToggle} />
        <AssistantThread />
        <ActivityTimeline />
        <AssistantComposer
          onSend={handleSend}
          onVoiceToggle={handleVoiceToggle}
          disabled={mode === 'thinking'}
        />
      </section>
    );
  }, [
    safeExpanded, viewport, expandedWidth, resizing,
    onResizeStart, handleVoiceToggle, handleSend, mode,
  ]);

  // ------- render -------
  // Mobile (<768px): bottom sheet WITH backdrop · taps outside dismiss
  // because there's no room to peek the underlying content anyway.
  if (viewport === 'bottom-sheet') {
    return (
      <>
        {safeExpanded && (
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setExpanded(false)}
            aria-hidden
          />
        )}
        <div
          data-lexai-assistant="bottom-sheet"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end"
          aria-label="Asistente Lex (móvil)"
        >
          {safeExpanded && (
            <div
              className="pointer-events-auto relative w-full"
              style={{ height: '82vh' }}
            >
              {expandedPanel}
            </div>
          )}
          {/* Floating orb persistent (U3) */}
          {!safeExpanded && (
            <div className="pointer-events-auto m-4">
              <VoiceOrb
                size="lg"
                onClick={() => setExpanded(true)}
                label="Abrir asistente Lex"
              />
            </div>
          )}
        </div>
      </>
    );
  }

  // Desktop / tablet: ALWAYS floating overlay · NO push (no body width hack),
  // NO backdrop (the user can keep working on the underlying canvas / page).
  // Visual cue that it's floating: shadow-2 + border-line on the left edge,
  // matching how Cursor / Notion AI / Spellbook handle their right panel.
  return (
    <div
      data-lexai-assistant="floating"
      className="pointer-events-none fixed inset-y-0 right-0 z-40 flex"
      aria-label="Asistente Lex"
    >
      <div className="pointer-events-auto relative flex h-full">
        {expandedPanel}
        <AssistantRail />
      </div>
    </div>
  );
}
