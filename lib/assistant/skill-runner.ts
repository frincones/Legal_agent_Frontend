/**
 * Client wrapper for the backend skill streaming endpoint.
 *
 * Reads the SSE stream from POST /api/skills/execute/stream (which proxies
 * to /v1/skills/execute/stream on the backend) and yields typed events.
 *
 * Why a thin wrapper?
 *   - Encapsulates the SSE parsing so multiple callers (AssistantSidebar,
 *     CanvasStreamRunner, future agents) share one implementation.
 *   - Lets us swap to NDJSON or WebSocket later by changing one file.
 *
 * Event shape mirrors the backend (see api/skills.py docstring):
 *   meta    | delta | warning | blocked | done | error
 */

export interface SkillStreamMeta {
  execution_id: string;
  command: string;
  skill_id: string | null;
  is_custom: boolean;
  name: string;
}

export interface SkillStreamDelta {
  text: string;
}

export interface SkillStreamWarning {
  hook: string;
  level: 'warn' | 'block';
  reason: string;
}

export interface SkillStreamDone {
  execution_id: string;
  duration_ms: number;
  tokens: { input: number; output: number };
  full_text: string;
  warnings: SkillStreamWarning[];
}

export interface SkillStreamError {
  error: string;
  detail?: string;
}

export interface SkillStreamToolStarted {
  name: string;
  round: number;
}

export interface SkillStreamToolFinished {
  name: string;
  round: number;
  ok: boolean;
  preview?: string;
}

/** Emitted right after `tool_finished` when the tool returned a `_ui_command`
 *  payload (canvas_set_text, ui_navigate, prefill_form, etc.). Caller routes
 *  it through uiCommandBus so the active components (CanvasEditor, router)
 *  apply the side effect. */
export interface SkillStreamUiCommand {
  action: string;
  [key: string]: unknown;
}

export type SkillStreamEvent =
  | { event: 'meta'; data: SkillStreamMeta }
  | { event: 'delta'; data: SkillStreamDelta }
  | { event: 'warning'; data: SkillStreamWarning }
  | { event: 'blocked'; data: { hook?: string; reason?: string } }
  | { event: 'tool_started'; data: SkillStreamToolStarted }
  | { event: 'tool_finished'; data: SkillStreamToolFinished }
  | { event: 'ui_command'; data: SkillStreamUiCommand }
  | { event: 'done'; data: SkillStreamDone }
  | { event: 'error'; data: SkillStreamError };

/** Conversation history entry forwarded to the backend so the agent has
 *  memory between chat turns. role: 'user' o 'assistant'. */
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RunSkillParams {
  command: string;
  input: Record<string, unknown>;
  matter_id?: string | null;
  document_id?: string | null;
  /** Últimos N mensajes del thread (user + assistant alternados) para que
   *  el backend los prependa al user_message actual · sin esto cada /ask
   *  es stateless y el agente olvida el contexto turno a turno. */
  history?: ChatHistoryMessage[];
  /**
   * Identificador estable del hilo (UUID generado en el cliente y persistido
   * en localStorage). Permite al backend agrupar varias ejecuciones bajo el
   * mismo thread y devolverlas en GET /v1/threads para el sidebar "Mis hilos".
   */
  session_id?: string | null;
  /** Modelo seleccionado por el usuario (gpt-4o, claude-opus, etc.) */
  model?: string;
  /** AbortSignal to cancel the stream. */
  signal?: AbortSignal;
}

/**
 * Run a skill and yield SSE events as they arrive.
 *
 * Usage:
 *   for await (const ev of runSkillStream({ command: '/redactar', input: {} })) {
 *     if (ev.event === 'delta') append(ev.data.text);
 *   }
 */
export async function* runSkillStream(
  params: RunSkillParams,
): AsyncGenerator<SkillStreamEvent, void, void> {
  const res = await fetch('/api/skills/execute/stream', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
    },
    body: JSON.stringify({
      command: params.command,
      input: params.input,
      matter_id: params.matter_id ?? null,
      document_id: params.document_id ?? null,
      history: params.history ?? [],
      // session_id agrupa ejecuciones en un mismo thread (sidebar "Mis hilos").
      // Sin esto el backend no puede devolver el listado de hilos del usuario.
      ...(params.session_id ? { session_id: params.session_id } : {}),
      ...(params.model ? { model: params.model } : {}),
    }),
    signal: params.signal,
    cache: 'no-store',
  });

  if (!res.ok || !res.body) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    yield {
      event: 'error',
      data: { error: `HTTP ${res.status}`, detail: detail.slice(0, 240) },
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames separated by a blank line ("\n\n").
      let sepIdx: number;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sepIdx).trim();
        buffer = buffer.slice(sepIdx + 2);
        if (!frame) continue;
        const ev = parseSSEFrame(frame);
        if (ev) yield ev;
      }
    }

    // Flush any trailing partial frame.
    const trailing = buffer.trim();
    if (trailing) {
      const ev = parseSSEFrame(trailing);
      if (ev) yield ev;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

function parseSSEFrame(frame: string): SkillStreamEvent | null {
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }

  const payload = dataLines.join('\n');
  if (!payload) return null;

  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    data = { raw: payload };
  }

  switch (eventName) {
    case 'meta':
      return { event: 'meta', data: data as SkillStreamMeta };
    case 'delta':
      return { event: 'delta', data: data as SkillStreamDelta };
    case 'warning':
      return { event: 'warning', data: data as SkillStreamWarning };
    case 'blocked':
      return { event: 'blocked', data: data as { hook?: string; reason?: string } };
    case 'tool_started':
      return { event: 'tool_started', data: data as SkillStreamToolStarted };
    case 'tool_finished':
      return { event: 'tool_finished', data: data as SkillStreamToolFinished };
    case 'ui_command':
      return { event: 'ui_command', data: data as SkillStreamUiCommand };
    case 'done':
      return { event: 'done', data: data as SkillStreamDone };
    case 'error':
      return { event: 'error', data: data as SkillStreamError };
    default:
      return null;
  }
}

/**
 * Parse a user message and decide what to dispatch.
 *
 *   "/redactar demanda foo bar"  → { command: '/redactar', input: { args: 'demanda foo bar' } }
 *   "¿cuál es el plazo?"         → { command: '/ask',      input: { prompt: '...' } }
 *
 * The "/ask" convention is what the assistant uses for plain-language
 * questions. If your firm doesn't have an /ask skill seeded, the backend
 * will return skill_not_found and the UI shows a hint to use /skill names.
 */
/** Maximum length of canvas document text we'll attach to a skill call.
 * Skill runner truncates server-side at 25 000 chars · we trim slightly earlier
 * so the user sees a "documento truncado" hint before the round-trip. */
export const MAX_ATTACHED_DOCUMENT_CHARS = 24_000;

export interface ParseContext {
  matter_id?: string | null;
  matter_titulo?: string | null;
  /** Open canvas content (markdown) · automatically attached as
   * input.document_text so /ask and /redactar/* skills can analyze it. */
  document_text?: string | null;
  /** Optional id of the active canvas document. */
  document_id?: string | null;
  /** Current page path · ej. '/casos/<id>/notas'. Permite al agente saber
   *  qué pestaña está mirando el usuario para inferir intención. */
  current_path?: string | null;
  /** Pestaña activa dentro del caso · 'notas' | 'canvas' | 'documentos' |
   *  'deadlines' | 'horas' | 'firmas' | 'comentarios' | ... */
  active_tab?: string | null;
}

export function parseUserMessage(
  text: string,
  context: ParseContext = {},
): RunSkillParams {
  const trimmed = text.trim();
  const isSlash = trimmed.startsWith('/');

  // Build the base input bag · shared between slash and free text.
  const base: Record<string, unknown> = {};
  if (context.matter_titulo) base.matter_titulo = context.matter_titulo;
  if (context.document_text && context.document_text.trim().length > 0) {
    base.document_text = context.document_text.slice(0, MAX_ATTACHED_DOCUMENT_CHARS);
  }
  // UI context · ayuda al agente a desambiguar (notes vs canvas, etc.)
  const uiCtx: Record<string, unknown> = {};
  if (context.current_path) uiCtx.current_path = context.current_path;
  if (context.active_tab) uiCtx.active_tab = context.active_tab;
  if (context.document_text != null) {
    uiCtx.canvas_has_content = context.document_text.trim().length > 200;
    uiCtx.canvas_chars = context.document_text.length;
  }
  if (Object.keys(uiCtx).length > 0) {
    base.context = uiCtx;
  }

  if (isSlash) {
    const firstSpace = trimmed.indexOf(' ');
    const command = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
    const argsRaw = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();
    return {
      command,
      input: argsRaw
        ? { ...base, prompt: argsRaw, args: { raw: argsRaw } }
        : base,
      matter_id: context.matter_id ?? null,
      document_id: context.document_id ?? null,
    };
  }
  return {
    command: '/ask',
    input: { ...base, prompt: trimmed },
    matter_id: context.matter_id ?? null,
    document_id: context.document_id ?? null,
  };
}
