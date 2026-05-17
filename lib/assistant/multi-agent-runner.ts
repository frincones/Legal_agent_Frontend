/**
 * Client wrapper for /api/multi-agent/generate/stream (SSE).
 *
 * The backend emits one of these event names:
 *   stage_started · stage_done · section_started · section_done ·
 *   critic_finding · validation · ready_to_send · error
 *
 * This wrapper parses the SSE frames and yields typed events the UI can
 * consume in a for-await loop.
 */

export interface MGStageEvent {
  stage: 'plan' | 'draft' | 'critic' | 'edit' | 'validate';
  sections?: string[];
}

export interface MGSectionEvent {
  section: string;
  title?: string;
  idx?: number;
  total?: number;
  draft_md?: string;
  edited_md?: string;
  stage?: string;
  text?: string;
}

export interface MGCriticFinding {
  section: string;
  severity: 'critical' | 'warning' | 'suggestion';
  issue: string;
  suggested_fix: string;
  norm_reference?: string;
}

export interface MGValidation {
  judge_score?: number;
  dimension_scores?: Record<string, number>;
  critical_issues?: string[];
  warnings?: string[];
  strengths?: string[];
  rationale?: string;
  error?: string;
}

export interface MGReadyToSend {
  generation_id: string;
  document_md: string;
  judge_score: number | null;
  dimension_scores: Record<string, number> | null;
  issues: string[];
  assumptions: string[];
  timings_ms: Record<string, number>;
  errors: string[];
}

export interface MGError {
  stage?: string;
  section?: string;
  error: string;
  detail?: string;
}

export type MultiAgentEvent =
  | { event: 'stage_started'; data: MGStageEvent }
  | { event: 'stage_done'; data: MGStageEvent }
  | { event: 'section_started'; data: MGSectionEvent }
  | { event: 'section_done'; data: MGSectionEvent }
  | { event: 'critic_finding'; data: MGCriticFinding }
  | { event: 'validation'; data: MGValidation }
  | { event: 'ready_to_send'; data: MGReadyToSend }
  | { event: 'error'; data: MGError };

export interface RunMultiAgentParams {
  materia: string;
  doc_kind: string;
  user_brief: string;
  template_id?: string | null;
  matter_id?: string | null;
  channel?: 'voice' | 'chat' | 'cmdk' | 'api';
  initial_slots?: Record<string, unknown>;
  signal?: AbortSignal;
}

export async function* runMultiAgent(
  params: RunMultiAgentParams,
): AsyncGenerator<MultiAgentEvent, void, void> {
  const res = await fetch('/api/multi-agent/generate/stream', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
    },
    body: JSON.stringify({
      materia: params.materia,
      doc_kind: params.doc_kind,
      user_brief: params.user_brief,
      template_id: params.template_id ?? null,
      matter_id: params.matter_id ?? null,
      channel: params.channel ?? 'chat',
      initial_slots: params.initial_slots ?? null,
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
      let sepIdx: number;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sepIdx).trim();
        buffer = buffer.slice(sepIdx + 2);
        if (!frame) continue;
        const ev = parseFrame(frame);
        if (ev) yield ev;
      }
    }
    const tail = buffer.trim();
    if (tail) {
      const ev = parseFrame(tail);
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

function parseFrame(frame: string): MultiAgentEvent | null {
  let eventName = 'message';
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
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
    case 'stage_started':
    case 'stage_done':
      return { event: eventName, data: data as MGStageEvent };
    case 'section_started':
    case 'section_done':
      return { event: eventName, data: data as MGSectionEvent };
    case 'critic_finding':
      return { event: 'critic_finding', data: data as MGCriticFinding };
    case 'validation':
      return { event: 'validation', data: data as MGValidation };
    case 'ready_to_send':
      return { event: 'ready_to_send', data: data as MGReadyToSend };
    case 'error':
      return { event: 'error', data: data as MGError };
    default:
      return null;
  }
}
