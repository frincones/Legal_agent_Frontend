'use client';

/**
 * F3-T08 · LexAI UX v2 — ComposerV2WithStream
 *
 * Wrapper listo para usar desde cualquier página v2.
 * Combina ComposerV2 + handler SSE + display de mensajes con StreamingCursor.
 *
 * Internamente reutiliza runSkillStream (el mismo que AssistantSidebar usa),
 * por lo que NO se toca el backend ni el endpoint proxy existente
 * /api/skills/execute/stream.
 *
 * Props:
 *   - matterId?: string — contexto del caso activo
 *   - sessionId?: string — id de sesión/thread
 *   - placeholder?: string
 *   - autoFocus?: boolean
 *   - activeTab?: string — pestaña activa en el caso
 *   - className?: string — clase extra para el contenedor
 *
 * Uso típico (F2 home):
 *   <ComposerV2WithStream matterId={matter.id} autoFocus />
 *
 * Feature flag: NEXT_PUBLIC_UX_V2_COMPOSER
 */

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { uiCommandBus, type UICommand } from '@/lib/voice/ui-command-bus';
import {
  runSkillStream,
} from '@/lib/assistant/skill-runner';
import { ComposerV2, type ComposerPayload } from './ComposerV2';
import { StreamingCursor } from './StreamingCursor';
import { DocumentArtifact } from './DocumentArtifact';
import { MarkdownContent } from '@/components/assistant/MarkdownContent';

// ─── Message types (local, no deps on assistant-store) ───────────────────────

interface DocumentArtifactData {
  type: 'document';
  content: string;
}

interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Mientras se reciben deltas del stream */
  streaming?: boolean;
  /** Herramientas usadas */
  toolsUsed?: string[];
  /**
   * Artifact detectado en el content del asistente.
   * Actualmente soporta type 'document' para bloques <plantilla-doc>.
   */
  artifact?: DocumentArtifactData;
}

/** Regex para detectar y extraer bloques <plantilla-doc>...</plantilla-doc>. */
const PLANTILLA_DOC_RE = /<plantilla-doc>([\s\S]*?)<\/plantilla-doc>/i;

/**
 * Extrae el contenido del bloque <plantilla-doc> si existe.
 * Retorna { docContent, cleanContent } donde cleanContent tiene el bloque removido.
 */
function extractPlantillaDoc(text: string): { docContent: string | null; cleanContent: string } {
  const match = PLANTILLA_DOC_RE.exec(text);
  if (!match) return { docContent: null, cleanContent: text };
  const docContent = (match[1] ?? '').trim();
  // Quitar el bloque completo del content visible + whitespace adyacente
  const cleanContent = text.replace(PLANTILLA_DOC_RE, '').replace(/\n{3,}/g, '\n\n').trim();
  return { docContent, cleanContent };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ComposerV2WithStreamProps {
  matterId?: string;
  sessionId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  activeTab?: string;
  className?: string;
  /** Mensajes iniciales (por ejemplo, day briefing cargado desde el servidor) */
  initialMessages?: ThreadMessage[];
  /**
   * Prompt prefilled en el composer (sincronizado cuando cambia).
   * Usado por los SuggestionChips de la home v2.
   */
  initialPrompt?: string;
}

// ─── Simple renderer para mensajes del usuario (plain text) ──────────────────

function SimpleMessage({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {content}
      {streaming && <StreamingCursor streaming={streaming} />}
    </span>
  );
}

// ─── Markdown renderer para mensajes del asistente ────────────────────────────

function AssistantMessage({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className="break-words min-w-0">
      <MarkdownContent source={content} density="compact" />
      {streaming && <StreamingCursor streaming={streaming} />}
    </div>
  );
}

// ─── ThinkingIndicator ────────────────────────────────────────────────────────

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[color:var(--v2-text-tertiary,#7A7870)] italic">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--v2-accent-copper,#B8763C)] animate-pulse"
        aria-hidden
      />
      {label}
    </div>
  );
}

// ─── ComposerV2WithStream ─────────────────────────────────────────────────────

export function ComposerV2WithStream({
  matterId,
  sessionId,
  placeholder,
  autoFocus,
  activeTab,
  className,
  initialMessages = [],
  initialPrompt = '',
}: ComposerV2WithStreamProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom after message update
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
      }
    });
  }, []);

  const updateLastAssistant = useCallback(
    (patch: Partial<ThreadMessage>) => {
      setMessages((prev) => {
        const idx = [...prev].reverse().findIndex((m) => m.role === 'assistant');
        if (idx === -1) return prev;
        const realIdx = prev.length - 1 - idx;
        return prev.map((m, i) => (i === realIdx ? { ...m, ...patch } : m));
      });
    },
    [],
  );

  const handleSend = useCallback(
    async (payload: ComposerPayload) => {
      // Abort previous stream if any
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      // Add user message
      const userMsg: ThreadMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: payload.input.prompt || `[${payload.attachments.map((a) => a.label).join(', ')}]`,
      };
      // Add assistant placeholder
      const assistantMsg: ThreadMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
        streaming: true,
        toolsUsed: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      setThinkingLabel('Pensando...');
      scrollToBottom();

      // Build history from current thread (last 8 turns)
      const HISTORY_LIMIT = 8;
      const historyToSend = messages
        .filter((m) => m.content.trim().length > 0)
        .slice(-HISTORY_LIMIT)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Build RunSkillParams from ComposerPayload
      const params = {
        command: payload.command,
        input: {
          prompt: payload.input.prompt,
          matter_titulo: undefined as string | undefined,
          context: {
            ...payload.input.context,
            current_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
          },
        },
        matter_id: payload.matter_id ?? null,
        document_id: undefined as string | undefined,
        history: historyToSend,
        signal: ac.signal,
        model: payload.model,
        session_id: payload.session_id,
      };

      let assistantContent = '';
      let receivedAnyDelta = false;
      const toolsUsed: string[] = [];

      try {
        for await (const ev of runSkillStream(params)) {
          if (ac.signal.aborted) break;

          switch (ev.event) {
            case 'meta':
              setThinkingLabel(`Ejecutando ${ev.data.name}...`);
              break;

            case 'delta':
              receivedAnyDelta = true;
              assistantContent += ev.data.text;
              updateLastAssistant({ content: assistantContent, streaming: true });
              scrollToBottom();
              break;

            case 'tool_started':
              if (!toolsUsed.includes(ev.data.name)) {
                toolsUsed.push(ev.data.name);
              }
              setThinkingLabel(`Ejecutando ${ev.data.name}...`);
              updateLastAssistant({ toolsUsed: [...toolsUsed] });
              break;

            case 'tool_finished':
              setThinkingLabel(
                toolsUsed.length === 1
                  ? `Usó ${toolsUsed[0]}`
                  : `Usó ${toolsUsed.length} herramientas`,
              );
              break;

            case 'ui_command': {
              const cmd = ev.data as unknown as UICommand;
              if (cmd && typeof cmd === 'object' && 'action' in cmd) {
                void uiCommandBus.dispatch(cmd);
              }
              break;
            }

            case 'done': {
              if (!receivedAnyDelta && ev.data.full_text) {
                assistantContent = ev.data.full_text;
                receivedAnyDelta = true;
              }
              // Limpiar tool name que el backend puede prefijar antes del texto real
              if (toolsUsed.length > 0) {
                const toolPattern = new RegExp(`^(${toolsUsed.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*\\n`, 'i');
                assistantContent = assistantContent.replace(toolPattern, '');
              }
              // Detectar bloque <plantilla-doc> y extraer como artifact
              const { docContent, cleanContent } = extractPlantillaDoc(assistantContent);
              const artifact: DocumentArtifactData | undefined = docContent
                ? { type: 'document', content: docContent }
                : undefined;
              updateLastAssistant({
                content: cleanContent,
                streaming: false,
                toolsUsed,
                ...(artifact ? { artifact } : {}),
              });
              setIsStreaming(false);
              setThinkingLabel(null);
              break;
            }

            case 'warning':
              console.warn('[ComposerV2WithStream] warning:', ev.data);
              break;

            case 'blocked':
              assistantContent += `\n\nAcción bloqueada: ${ev.data?.reason ?? 'sin motivo'}`;
              updateLastAssistant({ content: assistantContent, streaming: false });
              setIsStreaming(false);
              setThinkingLabel(null);
              break;

            case 'error':
              toast.error(`Error: ${ev.data.error}${ev.data.detail ? ` — ${ev.data.detail}` : ''}`);
              if (!receivedAnyDelta) {
                assistantContent = 'No pude procesar la solicitud. Reintenta.';
              }
              updateLastAssistant({ content: assistantContent, streaming: false, toolsUsed });
              setIsStreaming(false);
              setThinkingLabel(null);
              break;
          }
        }
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          const msg = e instanceof Error ? e.message : String(e);
          toast.error(`Error de red: ${msg}`);
          if (!receivedAnyDelta) {
            assistantContent = 'Error de conexión. Reintenta.';
          }
        }
      }

      // Finalize: retire streaming cursor, set final content
      if (!receivedAnyDelta && !assistantContent) {
        assistantContent = 'No recibí respuesta. Reintenta o usa otro comando.';
      }
      updateLastAssistant({ content: assistantContent, streaming: false, toolsUsed });
      setIsStreaming(false);
      setThinkingLabel(null);
      scrollToBottom();
      abortRef.current = null;
    },
    [messages, updateLastAssistant, scrollToBottom],
  );

  // Build history for ComposerV2
  const composerHistory = messages
    .filter((m) => m.content.trim().length > 0)
    .slice(-8)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  return (
    <div className={['flex flex-col h-full', className].filter(Boolean).join(' ')}>
      {/* ── Thread ── min-h-0 necesario para que flex no crezca infinito */}
      <div
        ref={threadRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4"
        aria-label="Hilo de conversación"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <p className="text-[15px] text-[color:var(--v2-text-tertiary,#7A7870)]">
              Pregúntale algo a LexAI
            </p>
          </div>
        )}

        {messages.map((msg) => {
          // Durante streaming, ocultar el bloque <plantilla-doc> del render inline
          // para evitar que se muestre como texto crudo mientras se reciben tokens.
          const displayContent = msg.streaming
            ? msg.content.replace(/<plantilla-doc[\s\S]*$/i, '').trimEnd()
            : msg.content;

          return (
            <div
              key={msg.id}
              className={[
                'flex flex-col gap-1',
                msg.role === 'user' ? 'items-end' : 'items-start',
              ].join(' ')}
            >
              {/* Role label */}
              <span className="text-[11px] font-medium text-[color:var(--v2-text-tertiary,#7A7870)] px-1">
                {msg.role === 'user' ? 'Usted' : 'LexAI'}
              </span>

              {/* Tools used indicator (assistant only) */}
              {msg.role === 'assistant' && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1 px-1 mb-0.5">
                  {msg.toolsUsed.map((tool) => (
                    <span
                      key={tool}
                      className="inline-block text-[10px] rounded-full bg-[color:var(--v2-bg-subtle,#F2F1EC)] text-[color:var(--v2-text-tertiary,#7A7870)] px-2 py-0.5"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}

              {/* Thinking indicator */}
              {msg.role === 'assistant' && msg.streaming && !displayContent && thinkingLabel && (
                <ThinkingIndicator label={thinkingLabel} />
              )}

              {/* Bubble */}
              {(displayContent || (!msg.streaming)) && (
                <div
                  className={[
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-[1.6]',
                    msg.role === 'user'
                      ? 'bg-[color:var(--v2-brand-navy,#0E2A5E)] text-white rounded-tr-sm'
                      : 'bg-[color:var(--v2-bg-subtle,#F2F1EC)] text-[color:var(--v2-text-primary,#1A1916)] rounded-tl-sm',
                  ].join(' ')}
                >
                  {msg.role === 'assistant' ? (
                    <AssistantMessage content={displayContent} streaming={msg.streaming} />
                  ) : (
                    <SimpleMessage content={displayContent} streaming={msg.streaming} />
                  )}
                </div>
              )}

              {/* DocumentArtifact: se muestra cuando el agente retornó un bloque <plantilla-doc> */}
              {msg.role === 'assistant' && msg.artifact?.type === 'document' && !msg.streaming && (
                <div className="max-w-[85%] w-full">
                  <DocumentArtifact content={msg.artifact.content} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Composer ── */}
      <div className="px-4 pb-4 pt-2">
        <ComposerV2
          matterId={matterId}
          sessionId={sessionId}
          onSend={handleSend}
          placeholder={placeholder}
          autoFocus={autoFocus}
          isStreaming={isStreaming}
          history={composerHistory}
          activeTab={activeTab}
          initialPrompt={initialPrompt}
        />
      </div>
    </div>
  );
}
