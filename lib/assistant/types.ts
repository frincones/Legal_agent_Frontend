/**
 * LexAI Assistant Sidebar — shared types.
 *
 * Unified data model for voice + chat in a single sidebar surface.
 * See components/assistant/README.md for architecture.
 */

export type SidebarMode =
  | 'idle'        // rail visible, no activity
  | 'chat'        // text input active
  | 'voice'       // realtime voice session active
  | 'thinking'    // agent processing (multi-agent / RAG)
  | 'acting'      // executing a tool / background task
  | 'awaiting';   // waiting for HITL approval

export type MessageChannel = 'voice' | 'chat';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  role: MessageRole;
  channel: MessageChannel;
  content: string;
  /** Partial transcripts (voice ASR) replace previous partials with same id. */
  isPartial?: boolean;
  createdAt: number;
  /** Citations attached to this message, if any. */
  citations?: Citation[];
  /** Tool call summary if assistant invoked tools to produce this message. */
  toolCalls?: ToolCallSummary[];
}

export interface Citation {
  /** Free-text reference, e.g. "CGP art. 369". */
  ref: string;
  /** Verification status — drives badge color in UI. */
  status: 'verified' | 'pending' | 'derogated' | 'unknown';
  /** Source slug, e.g. "csj", "corte_constitucional", "secop". */
  source?: string;
  /** Optional external URL to the source. */
  url?: string;
}

export interface ToolCallSummary {
  name: string;
  status: 'queued' | 'running' | 'done' | 'error';
  durationMs?: number;
  /** Trimmed preview of the result for the activity timeline. */
  preview?: string;
}

/** What the agent knows about WHERE the user currently is. */
export interface PageContext {
  /** Pathname from next/navigation. */
  route: string;
  /** Top-level area derived from route — drives tool scope. */
  area:
    | 'matter'        // /casos/[id]/...
    | 'matters_list'  // /casos
    | 'documents'     // /documentos
    | 'inbox'
    | 'calendar'
    | 'settings'
    | 'admin'
    | 'home'
    | 'other';
  /** Resolved matter id when route is /casos/[id]/... */
  matterId?: string;
  /** Optional matter metadata (title, materia, status) — lazy-loaded. */
  matterMeta?: {
    titulo?: string;
    materia?: string;
    status?: string;
    proximaFecha?: string;
  };
  /** Document id when route is /documentos/[id] or canvas open. */
  documentId?: string;
  /** Selected text in canvas/editor (if relevant for the message). */
  selection?: string;
  /** Timestamp of last context refresh — used for staleness checks. */
  detectedAt: number;
}

/** Suggested action proposed by the agent inline in the thread. */
export interface ActionCardData {
  id: string;
  kind:
    | 'add_deadline'
    | 'cite_norm'
    | 'open_document'
    | 'create_note'
    | 'send_email'
    | 'sign_document'
    | 'archive_matter'
    | 'generate_document'
    | 'custom';
  title: string;
  description?: string;
  /** Confirmation level required before executing. */
  approval: 'auto' | 'one_click' | 'confirm' | 'double_confirm';
  /** Free-form payload passed to the executing tool. */
  payload?: Record<string, unknown>;
  /** Source agent / skill that proposed this action. */
  proposedBy?: string;
  /** Once executed, the result preview shown inline. */
  resultPreview?: string;
  status: 'proposed' | 'executing' | 'done' | 'dismissed' | 'error';
  createdAt: number;
}

/** Long-running task that does not block conversation. */
export interface TaskCardData {
  id: string;
  title: string;
  /** Progress percentage 0-100 if known. */
  progress?: number;
  /** Step label, e.g. "Pretensiones 2/4". */
  step?: string;
  /** Estimated remaining seconds. */
  etaSeconds?: number;
  status: 'running' | 'paused' | 'done' | 'cancelled' | 'error';
  startedAt: number;
  /** When the task wraps up, optional follow-up action card. */
  resultActionId?: string;
}

/** Activity timeline entry — what the agent did, with audit links. */
export interface ActivityItem {
  id: string;
  /** ISO timestamp for human display. */
  ts: string;
  kind:
    | 'message_sent'
    | 'tool_called'
    | 'document_generated'
    | 'citation_verified'
    | 'context_loaded'
    | 'hitl_decided';
  label: string;
  /** Optional structured detail (rendered in expandable row). */
  detail?: Record<string, unknown>;
  /** Optional undo handler hint — the UI knows which mutation to revert. */
  undoable?: boolean;
  /** Backing record id, e.g. skill_executions.id or agent_traces.id. */
  recordId?: string;
}

/** A proactive nudge the agent surfaces — silenced after N dismissals/matter. */
export interface ProactiveNudgeData {
  id: string;
  /** Stable key used for dismissal counting. e.g. "deadline_approaching". */
  category: string;
  matterId?: string;
  title: string;
  body?: string;
  ctaLabel: string;
  ctaAction: () => void | Promise<void>;
}

export interface AssistantPreferences {
  /** Last expansion state — restored on next session. */
  isExpanded: boolean;
  /** Sidebar width when expanded (px) — user can drag-resize (U8). */
  expandedWidth: number;
  /** Has the user dismissed the onboarding tooltip (U5)? */
  onboardingSeen: boolean;
  /** Per-matter nudge dismissal counters (anti-friction). */
  nudgeDismissCounts: Record<string, number>;
}

export const ASSISTANT_DEFAULTS: AssistantPreferences = {
  isExpanded: false,
  // Default chosen so a 1920px monitor leaves the host shell at ~1480px
  // (still comfortable for the canvas editor's 3 columns).
  expandedWidth: 380,
  onboardingSeen: false,
  nudgeDismissCounts: {},
};

export const SIDEBAR_RAIL_WIDTH = 56;
export const SIDEBAR_MIN_WIDTH = 320;
export const SIDEBAR_MAX_WIDTH = 640;

/** Breakpoints (revised after first usability pass):
 *   ≥ 1600 px → push  (true reflow · safe on ultrawide / 27" monitors)
 *   < 1600 px → overlay (floats on top of content, dismissable by clicking outside)
 *   <  768 px → bottom-sheet + floating orb (mobile)
 *
 * The previous 1280 push breakpoint crushed the canvas page on 13–15" laptops
 * because the canvas itself has a toolbox + editor + citations sidebar. Now
 * most laptops use overlay, only big screens push. */
export const BREAKPOINT_PUSH_PX = 1600;
export const BREAKPOINT_BOTTOM_SHEET_PX = 768;
