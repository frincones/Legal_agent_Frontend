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

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { uiCommandBus, type UICommand } from '@/lib/voice/ui-command-bus';
import {
  runSkillStream,
} from '@/lib/assistant/skill-runner';
import { ComposerV2, type ComposerPayload } from './ComposerV2';
import { StreamingCursor } from './StreamingCursor';
import { DocumentArtifact } from './DocumentArtifact';
import { MarkdownContent } from '@/components/assistant/MarkdownContent';
import { upsertThread } from '@/lib/v2/threadIndex';
import { detectDocumentIntent } from '@/lib/v2/document-gen/intentDetector';

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
const PLANTILLA_DOC_FULL_RE = /<plantilla-doc>([\s\S]*?)<\/plantilla-doc>/i;
/** Regex tolerante: <plantilla-doc> sin cierre — toma todo hasta el final del texto. */
const PLANTILLA_DOC_OPEN_RE = /<plantilla-doc>([\s\S]*)$/i;

/**
 * Extrae el contenido del bloque <plantilla-doc> si existe.
 * Acepta tanto la forma completa con cierre como la forma sin cierre
 * (el LLM frecuentemente omite el </plantilla-doc>). Retorna
 * { docContent, cleanContent } donde cleanContent tiene el bloque removido.
 */
function extractPlantillaDoc(text: string): { docContent: string | null; cleanContent: string } {
  // 1) Intentar match completo con cierre
  let match = PLANTILLA_DOC_FULL_RE.exec(text);
  if (match) {
    const docContent = (match[1] ?? '').trim();
    const cleanContent = text.replace(PLANTILLA_DOC_FULL_RE, '').replace(/\n{3,}/g, '\n\n').trim();
    return { docContent, cleanContent };
  }
  // 2) Intentar match sin cierre — toma todo desde <plantilla-doc> hasta EOF
  match = PLANTILLA_DOC_OPEN_RE.exec(text);
  if (match) {
    const docContent = (match[1] ?? '').trim();
    const cleanContent = text.replace(PLANTILLA_DOC_OPEN_RE, '').replace(/\n{3,}/g, '\n\n').trim();
    return { docContent, cleanContent };
  }
  return { docContent: null, cleanContent: text };
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
  /**
   * Callback opcional notificado cada vez que cambia el numero de mensajes
   * del hilo. Permite al padre (ej. DayBriefingPageClient) saber si esta
   * en estado vacio (0 mensajes) para renderizar un hero alternativo.
   */
  onMessagesChange?: (count: number) => void;
  /**
   * Si true, cuando `messages.length === 0` el componente renderiza SOLO el
   * cuadro de composer (sin thread div y sin h-full). Util para layouts
   * tipo hero donde el padre controla el centrado vertical (ej. /v2/inicio).
   * Cuando aparezca el primer mensaje, el componente reactivamente vuelve
   * a su layout normal (thread arriba + composer sticky abajo).
   */
  compactWhenEmpty?: boolean;
  /**
   * Si true, al montar el composer NO restaura el hilo activo desde
   * localStorage. Inicia con messages=[] y nuevo session_id.
   *  - Excepcion: si el sidebar marco `lexai-v2-pending-open-session` justo
   *    antes de navegar (click en "Mis hilos"), el composer carga ese hilo
   *    especifico y consume el flag.
   * El persist a localStorage se omite cuando messages.length === 0 para
   * no destruir el snapshot del hilo previo. Usado por /v2/inicio para
   * garantizar que la home siempre arranque en estado hero.
   */
  freshStart?: boolean;
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

// ─── LocalStorage key helpers ────────────────────────────────────────────────

const LS_THREAD_BASE = 'lexai-v2-current-thread';
const LS_SESSION_BASE = 'lexai-v2-current-session';

function getThreadStorageKey(matterId?: string): string {
  return matterId ? `${LS_THREAD_BASE}:${matterId}` : LS_THREAD_BASE;
}

function getSessionStorageKey(matterId?: string): string {
  return matterId ? `${LS_SESSION_BASE}:${matterId}` : LS_SESSION_BASE;
}

function readThreadFromStorage(key: string, fallback: ThreadMessage[]): ThreadMessage[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as ThreadMessage[];
  } catch {
    /* noop */
  }
  return fallback;
}

/**
 * Lee (o genera) un session_id estable persistido en localStorage. El backend
 * usa este id para agrupar las ejecuciones del thread en GET /v1/threads, lo
 * que permite que el sidebar "Mis hilos" muestre los hilos del usuario.
 */
function readOrCreateSessionId(key: string): string {
  if (typeof window === 'undefined') {
    return `s-${Date.now()}`;
  }
  try {
    const stored = localStorage.getItem(key);
    if (stored && stored.length > 0) return stored;
    const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return `s-${Date.now()}`;
  }
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
  onMessagesChange,
  compactWhenEmpty = false,
  freshStart = false,
}: ComposerV2WithStreamProps) {
  const storageKey = getThreadStorageKey(matterId);
  const sessionKey = getSessionStorageKey(matterId);

  // LEXAI_HYDRATION_FIX_V2_CACHEBUST
  // CLIENT-ONLY hydration pattern para evitar hydration mismatch.
  // Server renderiza siempre con initialMessages (vacío). Cliente lee
  // localStorage tras montar. Sin esto, React detecta mismatch entre el
  // árbol del server (lista vacía) y el del cliente (lista con N mensajes
  // persistidos) y dispara error #418/#422 + re-renderiza desde cero.
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessionId ?? '');

  useEffect(() => {
    // Modo freshStart (/v2/inicio): NO restaurar el hilo activo automaticamente.
    // Excepcion: si el sidebar marco un session_id pendiente (click en "Mis hilos"),
    // cargar ese hilo especifico y consumir el flag.
    if (freshStart && !matterId) {
      try {
        const pendingSid = localStorage.getItem('lexai-v2-pending-open-session');
        if (pendingSid) {
          const snapshot = localStorage.getItem(`lexai-v2-thread-msgs:${pendingSid}`);
          const parsed = snapshot ? (JSON.parse(snapshot) as ThreadMessage[]) : [];
          setMessages(parsed);
          setActiveSessionId(pendingSid);
          localStorage.setItem('lexai-v2-current-thread', snapshot ?? '[]');
          localStorage.setItem('lexai-v2-current-session', pendingSid);
          localStorage.removeItem('lexai-v2-pending-open-session');
        } else {
          // Sin hilo pendiente: empezar limpio con nuevo session_id
          setMessages([]);
          const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
            ? crypto.randomUUID()
            : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          setActiveSessionId(fresh);
          // NO escribimos a current-thread/current-session aqui: el primer
          // mensaje del usuario hara la persistencia.
        }
      } catch {
        setMessages([]);
        setActiveSessionId(`s-${Date.now()}`);
      }
      setHasHydrated(true);
      return;
    }

    // Modo normal: restaurar hilo activo desde localStorage
    const stored = readThreadFromStorage(storageKey, initialMessages);
    if (stored.length > 0 || initialMessages.length === 0) {
      setMessages(stored);
    }
    if (!sessionId) {
      setActiveSessionId(readOrCreateSessionId(sessionKey));
    }
    setHasHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, sessionKey, freshStart, matterId]);

  // Persist thread to localStorage whenever messages change (post-hydration).
  // Persistimos en DOS claves:
  //  1) storageKey (activa) — para que recargar /v2/inicio recupere el hilo.
  //  2) lexai-v2-thread-msgs:<session_id> — snapshot por hilo, usado por el
  //     sidebar al "abrir" un hilo viejo (promueve este snapshot a la activa).
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) return;
    // No sobrescribir current con []: preserva el snapshot del hilo previo
    // para que "Mis hilos" pueda re-abrirlo. Solo escribimos cuando hay
    // mensajes reales (>= 1 turno).
    if (messages.length === 0) return;
    try {
      const serialized = JSON.stringify(messages);
      localStorage.setItem(storageKey, serialized);
      if (activeSessionId) {
        localStorage.setItem(`lexai-v2-thread-msgs:${activeSessionId}`, serialized);
      }
    } catch {
      /* noop — storage quota */
    }
  }, [messages, storageKey, hasHydrated, activeSessionId]);

  // Notificar al padre cuantos mensajes hay (post-hidratacion). Permite que
  // el padre (DayBriefingPageClient) decida si renderiza el hero o el chat.
  useEffect(() => {
    if (!hasHydrated) return;
    onMessagesChange?.(messages.length);
  }, [messages.length, hasHydrated, onMessagesChange]);

  // Escuchar 'lexai:open-thread' (click en un hilo del sidebar): re-hidratar
  // mensajes desde el snapshot por session_id y rotar activeSessionId.
  useEffect(() => {
    const handler = (e: Event) => {
      if (matterId) return; // hilos por matter se manejan aparte
      const detail = (e as CustomEvent<{ session_id?: string }>).detail;
      const sid = detail?.session_id;
      if (!sid) return;
      try {
        const snapshot = localStorage.getItem(`lexai-v2-thread-msgs:${sid}`);
        const parsed = snapshot ? (JSON.parse(snapshot) as ThreadMessage[]) : [];
        setMessages(parsed);
        localStorage.setItem('lexai-v2-current-thread', snapshot ?? '[]');
        localStorage.setItem('lexai-v2-current-session', sid);
        setActiveSessionId(sid);
      } catch {
        /* noop */
      }
    };
    window.addEventListener('lexai:open-thread', handler);
    return () => window.removeEventListener('lexai:open-thread', handler);
  }, [matterId]);
  const [externalPrompt, setExternalPrompt] = useState(initialPrompt);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Escuchar evento global para abrir el composer pre-completado con un skill.
  // Disparado por SidebarSkillsList (y cualquier otro componente que necesite
  // inyectar un comando directamente al composer).
  useEffect(() => {
    const handler = (e: Event) => {
      const { command, prompt: skillPrompt } = (e as CustomEvent<{ command: string; prompt: string }>).detail;
      const text = [command, skillPrompt].filter(Boolean).join(' ');
      setExternalPrompt(text);
    };
    window.addEventListener('lexai:open-composer-with-skill', handler);
    return () => window.removeEventListener('lexai:open-composer-with-skill', handler);
  }, []);

  // Escuchar evento global 'lexai:new-thread' (botón Nueva conversación del sidebar)
  // para resetear el hilo local sin necesidad de remount.
  useEffect(() => {
    const handler = () => {
      // Solo resetea el hilo "principal" (sin matter). Si este composer está
      // ligado a un matter, se ignora el evento global.
      if (matterId) return;
      setMessages([]);
      setExternalPrompt('');
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(sessionKey);
      } catch {
        /* noop */
      }
      // Generar un nuevo session_id para el siguiente turno
      const fresh = readOrCreateSessionId(sessionKey);
      setActiveSessionId(fresh);
    };
    window.addEventListener('lexai:new-thread', handler);
    return () => window.removeEventListener('lexai:new-thread', handler);
  }, [matterId, storageKey, sessionKey]);

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
      // ─── SPRINT M7: deteccion de intent + redirect a canvas integrado v2 ───
      // Si NEXT_PUBLIC_DOC_GEN_V2_ENABLED y el prompt es claramente un
      // pedido de generacion (confidence >= 0.85), navegamos a
      // /v2/canvas/draft?engine=v2 (canvas integrado con chat lateral).
      // Sin el flag, el flow legacy de chat asistente sigue como hoy.
      if (
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_DOC_GEN_V2_ENABLED === 'true' &&
        !matterId
      ) {
        const prompt = payload.input.prompt || '';
        const detection = detectDocumentIntent(prompt);
        if (detection.isDocumentRequest && detection.confidence >= 0.85) {
          const { mapToTemplateId } = await import('@/lib/v2/document-gen/templateMapper');
          const templateId = mapToTemplateId(detection.docType, detection.materia, prompt);
          // Redirige al canvas integrado v2 (Sprint M7)
          const url = new URL('/v2/canvas/draft', window.location.origin);
          url.searchParams.set('engine', 'v2');
          url.searchParams.set('intent', prompt);
          if (templateId) url.searchParams.set('template', templateId);
          if (payload.matter_id) url.searchParams.set('matter_id', payload.matter_id);
          window.location.assign(url.toString());
          return; // NO continuar con flow chat normal
        }
      }

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
      // session_id se forwardea SIEMPRE al backend para que pueda agrupar
      // ejecuciones del mismo hilo y devolverlas en GET /v1/threads.
      const effectiveSessionId = payload.session_id || activeSessionId || undefined;
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
        session_id: effectiveSessionId,
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
              // Persistir hilo en el indice local — sidebar lo lee desde aqui
              // (el backend no expone listado por session_id).
              if (effectiveSessionId) {
                upsertThread({
                  session_id: effectiveSessionId,
                  firstPrompt: userMsg.content,
                  matter_id: payload.matter_id ?? null,
                  messageCount: messages.length + 2, // +user +assistant
                });
              }
              // Notificar al sidebar para re-render
              window.dispatchEvent(new CustomEvent('lexai:thread-completed'));
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

  // Modo compacto: sin thread div ni h-full. El padre controla el centrado
  // vertical (caso /v2/inicio hero). Apenas hay >=1 mensaje, volvemos al
  // layout normal automaticamente.
  const isCompact = compactWhenEmpty && messages.length === 0;

  if (isCompact) {
    return (
      <div className={['flex flex-col', className].filter(Boolean).join(' ')}>
        <div className="mx-auto w-full">
          <ComposerV2
            matterId={matterId}
            sessionId={sessionId}
            onSend={handleSend}
            placeholder={placeholder}
            autoFocus={autoFocus}
            isStreaming={isStreaming}
            history={composerHistory}
            activeTab={activeTab}
            initialPrompt={externalPrompt}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={['flex flex-col h-full', className].filter(Boolean).join(' ')}>
      {/* ── Thread ── min-h-0 necesario para que flex no crezca infinito */}
      <div
        ref={threadRef}
        className="flex-1 min-h-0 overflow-y-auto"
        aria-label="Hilo de conversación"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* Contenedor centrado con reading-width controlado */}
        <div className="mx-auto max-w-[720px] px-4 py-4 space-y-4">
          {messages.map((msg) => {
            // SIEMPRE ocultar el bloque <plantilla-doc>...</plantilla-doc> y
            // también el tag abierto sin cierre. Si el done event ya lo
            // extrajo, msg.content ya está limpio. Si no (race condition o
            // LLM omitió el cierre), este replace lo cubre como safety net.
            const displayContent = msg.content
              .replace(/<plantilla-doc>[\s\S]*?<\/plantilla-doc>/gi, '')
              .replace(/<plantilla-doc>[\s\S]*$/i, '')
              .replace(/\n{3,}/g, '\n\n')
              .trimEnd();

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

                {/* Bubble — max-width fijo para legibilidad (regla tipográfica 65-72ch).
                    Asistente: máximo 680px, fondo sutil.
                    Usuario: máximo 560px, alineado derecha, fondo navy. */}
                {(displayContent || (!msg.streaming)) && (
                  <div
                    className={[
                      'rounded-2xl px-4 py-3 text-[14px] leading-[1.65]',
                      msg.role === 'user'
                        ? 'ml-auto max-w-[560px] bg-[color:var(--v2-brand-navy,#0E2A5E)] text-white rounded-tr-sm shadow-sm'
                        : 'max-w-[680px] bg-[color:var(--v2-bg-subtle,#F2F1EC)] text-[color:var(--v2-text-primary,#1A1916)] rounded-tl-sm shadow-sm',
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
                  <div className="max-w-[680px] w-full">
                    <DocumentArtifact content={msg.artifact.content} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Composer ── sticky bottom, prominente (min 64px) */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto max-w-[720px]">
          <ComposerV2
            matterId={matterId}
            sessionId={sessionId}
            onSend={handleSend}
            placeholder={placeholder}
            autoFocus={autoFocus}
            isStreaming={isStreaming}
            history={composerHistory}
            activeTab={activeTab}
            initialPrompt={externalPrompt}
          />
        </div>
      </div>
    </div>
  );
}
