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

export type SkillStreamEvent =
  | { event: 'meta'; data: SkillStreamMeta }
  | { event: 'delta'; data: SkillStreamDelta }
  | { event: 'warning'; data: SkillStreamWarning }
  | { event: 'blocked'; data: { hook?: string; reason?: string } }
  | { event: 'done'; data: SkillStreamDone }
  | { event: 'error'; data: SkillStreamError };

export interface RunSkillParams {
  command: string;
  input: Record<string, unknown>;
  matter_id?: string | null;
  document_id?: string | null;
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
export function parseUserMessage(
  text: string,
  context: { matter_id?: string | null; matter_titulo?: string | null } = {},
): RunSkillParams {
  const trimmed = text.trim();
  if (trimmed.startsWith('/')) {
    const firstSpace = trimmed.indexOf(' ');
    const command = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
    const argsRaw = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim();
    return {
      command,
      input: argsRaw
        ? {
            prompt: argsRaw,
            args: { raw: argsRaw },
            ...(context.matter_titulo ? { matter_titulo: context.matter_titulo } : {}),
          }
        : (context.matter_titulo ? { matter_titulo: context.matter_titulo } : {}),
      matter_id: context.matter_id ?? null,
    };
  }
  return {
    command: '/ask',
    input: {
      prompt: trimmed,
      ...(context.matter_titulo ? { matter_titulo: context.matter_titulo } : {}),
    },
    matter_id: context.matter_id ?? null,
  };
}
