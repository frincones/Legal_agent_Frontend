'use client';

/**
 * F3-T01 · LexAI UX v2 — ComposerV2
 *
 * Composer estilo Claude con:
 *   - Caja redondeada (16px), bg blanco, border sutil, shadow-md
 *   - AttachmentList (chips) arriba del textarea
 *   - Textarea autosize (1-8 líneas, sin scrollbar visible)
 *   - Fila inferior: (izq) PlusMenu + ModelSelector | (der) VoiceRecorder + SendButton
 *   - Submit con Enter (Shift+Enter = nueva línea)
 *   - Send habilitado solo si prompt.trim() !== '' || attachments.length > 0
 *   - isStreaming: send button muestra spinner
 *
 * Feature flag: proceso externo · el padre monta ComposerV2 solo si
 * NEXT_PUBLIC_UX_V2_COMPOSER === 'true'.
 *
 * NO modifica AssistantSidebar ni ningún componente legacy.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Send, Loader2, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { AttachmentChip, type Attachment } from './AttachmentChip';
import { ComposerPlusMenu } from './ComposerPlusMenu';
import { ModelSelector, type ComposerModel } from './ModelSelector';
import { VoiceRecorder } from './VoiceRecorder';

// ─── Payload que se emite en onSend ──────────────────────────────────────────

export interface ComposerPayload {
  /** Skill command (e.g. '/redactar/tutela') o '/ask' por defecto */
  command: string;
  input: {
    prompt: string;
    context: {
      matter_id?: string;
      party_ids?: string[];
      judge_id?: string;
      deadline_ids?: string[];
      doc_ids?: string[];
      search_jurisprudence: boolean;
      connector_invocations?: string[];
      active_tab?: string;
    };
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  matter_id?: string;
  model: ComposerModel;
  session_id?: string;
  attachments: Attachment[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ComposerV2Props {
  initialPrompt?: string;
  matterId?: string;
  sessionId?: string;
  onSend: (payload: ComposerPayload) => void | Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  /** Set a true para bloquear el compositor mientras el padre procesa. */
  isStreaming?: boolean;
  /** Últimos N turnos del thread — se incluyen en el payload como history. */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Pestaña activa para contexto UI */
  activeTab?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const LINE_HEIGHT_PX = 24; // ~1.5rem a 16px
const MIN_ROWS = 1;
const MAX_ROWS = 8;
const MAX_HEIGHT = LINE_HEIGHT_PX * MAX_ROWS; // 192px

// ─── ComposerV2 ───────────────────────────────────────────────────────────────

export function ComposerV2({
  initialPrompt = '',
  matterId,
  sessionId,
  onSend,
  placeholder = 'Pregúntale algo a LexAI o usa /skill...',
  autoFocus = false,
  isStreaming = false,
  history,
  activeTab,
}: ComposerV2Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState<ComposerModel>('gpt-4o');
  const [searchJurisprudencia, setSearchJurisprudencia] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const connectorInvocations = useRef<string[]>([]);

  // Auto-resize textarea (1 to MAX_ROWS)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(scrollH, MAX_HEIGHT)}px`;
    el.style.overflowY = scrollH > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [prompt]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Sync initialPrompt → state when prop changes externally
  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const canSend = (prompt.trim() !== '' || attachments.length > 0) && !isStreaming && !voiceRecording;

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addAttachment = useCallback((attachment: Attachment) => {
    setAttachments((prev) => {
      // Evitar duplicados por entityId
      if (attachment.entityId && prev.some((a) => a.entityId === attachment.entityId)) {
        toast.info(`"${attachment.label}" ya está adjunto`);
        return prev;
      }
      return [...prev, attachment];
    });
  }, []);

  // ─── Send ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    const matterAttachments = attachments.filter((a) => a.type === 'matter');
    const partyAttachments = attachments.filter((a) => a.type === 'party');
    const judgeAttachments = attachments.filter((a) => a.type === 'judge');
    const deadlineAttachments = attachments.filter((a) => a.type === 'deadline');
    const docAttachments = attachments.filter((a) => a.type === 'doc');

    const payload: ComposerPayload = {
      command: activeSkill ?? '/ask',
      input: {
        prompt: prompt.trim(),
        context: {
          matter_id: matterAttachments[0]?.entityId ?? matterId,
          party_ids: partyAttachments.map((a) => a.entityId ?? a.id),
          judge_id: judgeAttachments[0]?.entityId,
          deadline_ids: deadlineAttachments.map((a) => a.entityId ?? a.id),
          doc_ids: docAttachments.map((a) => a.entityId ?? a.id),
          search_jurisprudence: searchJurisprudencia,
          connector_invocations: connectorInvocations.current.length > 0
            ? [...connectorInvocations.current]
            : undefined,
          active_tab: activeTab,
        },
      },
      history: history ?? [],
      matter_id: matterAttachments[0]?.entityId ?? matterId,
      model,
      session_id: sessionId,
      attachments,
    };

    // Reset state before calling onSend (optimistic)
    setPrompt('');
    setAttachments([]);
    setActiveSkill(null);
    setSearchJurisprudencia(false);
    connectorInvocations.current = [];

    try {
      await onSend(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al enviar el mensaje';
      toast.error(msg);
    }
  }, [
    canSend,
    prompt,
    attachments,
    activeSkill,
    matterId,
    searchJurisprudencia,
    history,
    model,
    sessionId,
    activeTab,
    onSend,
  ]);

  // ─── Keyboard handler ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  // ─── PlusMenu callbacks ───────────────────────────────────────────────────

  const handleAttachDocument = useCallback(
    (file: File) => {
      const attachment: Attachment = {
        id: `doc-${Date.now()}`,
        type: 'doc',
        label: file.name.length > 24 ? `${file.name.slice(0, 21)}...` : file.name,
        entityId: `file:${file.name}`,
      };
      addAttachment(attachment);
      // TODO: upload file → get doc_id from backend, then update attachment.entityId
      toast.info(`"${file.name}" adjuntado. La subida al servidor se implementará próximamente.`);
    },
    [addAttachment],
  );

  const handleSelectSkill = useCallback((slug: string) => {
    setActiveSkill(slug);
    // Insert the slash command at the start of the prompt as a hint
    setPrompt((prev) => {
      if (prev.startsWith('/')) return prev;
      return slug + (prev ? ` ${prev}` : '');
    });
    textareaRef.current?.focus();
  }, []);

  const handleSelectConnector = useCallback((slug: string) => {
    if (!connectorInvocations.current.includes(slug)) {
      connectorInvocations.current = [...connectorInvocations.current, slug];
    }
    const labels: Record<string, string> = {
      dian: 'DIAN',
      rama_judicial: 'Rama Judicial',
      igac: 'IGAC',
      sicaac: 'SICAAC',
    };
    toast.success(`Conector ${labels[slug] ?? slug} activado para esta consulta`);
  }, []);

  const handleInsertTemplate = useCallback((text: string) => {
    setPrompt((prev) => (prev ? `${prev}\n${text}` : text));
    textareaRef.current?.focus();
  }, []);

  const handleTranscript = useCallback((text: string) => {
    setPrompt((prev) => (prev ? `${prev} ${text}` : text));
    textareaRef.current?.focus();
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      role="form"
      aria-label="Compositor de mensajes"
      className={[
        'flex flex-col gap-0',
        'rounded-2xl border border-[color:var(--v2-border-default,#D4D2CB)]',
        'bg-[color:var(--v2-bg-surface,#FFFFFF)]',
        'shadow-md',
        'transition-shadow duration-200',
        'focus-within:shadow-lg focus-within:border-[color:var(--v2-accent-copper,#B8763C)]/40',
        isStreaming ? 'opacity-80' : '',
      ].join(' ')}
    >
      {/* ── Attachment chips ── */}
      {attachments.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 px-4 pt-3 pb-0"
          aria-label="Adjuntos"
          role="list"
        >
          {attachments.map((att) => (
            <div key={att.id} role="listitem">
              <AttachmentChip attachment={att} onRemove={removeAttachment} />
            </div>
          ))}
        </div>
      )}

      {/* ── Active skill chip ── */}
      {activeSkill && (
        <div className="flex items-center gap-1.5 px-4 pt-2 pb-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-medium text-purple-700">
            {activeSkill}
            <button
              type="button"
              onClick={() => { setActiveSkill(null); setPrompt((p) => p.replace(activeSkill, '').trimStart()); }}
              aria-label="Quitar skill"
              className="ml-0.5 rounded-full opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* ── Textarea / Voice waveform ──
          min-height 40px garantiza que el composer sea visualmente prominente
          incluso cuando el prompt esta vacio (FIX D). */}
      <div className="px-4 pt-2.5 pb-1.5">
        {voiceRecording ? (
          /* Waveform inline cuando esta grabando */
          <VoiceRecorder
            onTranscript={handleTranscript}
            disabled={isStreaming}
            onRecordingStart={() => setVoiceRecording(true)}
            onRecordingEnd={() => setVoiceRecording(false)}
            startOnMount
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isStreaming}
            rows={MIN_ROWS}
            aria-label="Mensaje para LexAI"
            aria-multiline="true"
            className={[
              'block w-full resize-none bg-transparent',
              'text-[14px] leading-[1.5] text-[color:var(--v2-text-primary,#1A1916)]',
              'placeholder:text-[color:var(--v2-text-tertiary,#7A7870)]',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'scrollbar-none',
            ].join(' ')}
            style={{ minHeight: '28px', overflow: 'hidden' }}
          />
        )}
      </div>

      {/* ── Bottom toolbar ── */}
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1">
        {/* Left: PlusMenu + ModelSelector */}
        <div className="flex items-center gap-1">
          <ComposerPlusMenu
            onAttachDocument={handleAttachDocument}
            onAttachMatter={addAttachment}
            onAttachParty={addAttachment}
            onAttachJudge={addAttachment}
            onAttachDeadline={addAttachment}
            onSelectSkill={handleSelectSkill}
            onToggleJurisprudencia={() => setSearchJurisprudencia((v) => !v)}
            jurisprudenciaActive={searchJurisprudencia}
            onSelectConnector={handleSelectConnector}
            onToggleVoice={() => setVoiceRecording((v) => !v)}
            onInsertTemplate={handleInsertTemplate}
            disabled={isStreaming}
          />
          <ModelSelector onChangeModel={setModel} />
          {/* Jurisprudencia badge when active */}
          {searchJurisprudencia && (
            <span className="ml-1 inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              Jurisp. activa
            </span>
          )}
        </div>

        {/* Right: Mic trigger (idle only) + SendButton */}
        <div className="flex items-center gap-1.5">
          {/* Mic trigger — visible only when NOT in voice waveform mode.
              Clicking it sets voiceRecording=true which mounts the inline
              VoiceRecorder (with startOnMount) in the textarea area. */}
          {!voiceRecording && (
            <button
              type="button"
              onClick={() => setVoiceRecording(true)}
              disabled={isStreaming}
              aria-label="Iniciar grabación de voz"
              className={[
                'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full',
                'text-[color:var(--v2-text-secondary,#4A4944)]',
                'hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)] hover:text-[color:var(--v2-text-primary,#1A1916)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]',
                'disabled:cursor-not-allowed disabled:opacity-40',
                'transition-colors duration-150',
              ].join(' ')}
            >
              <Mic className="h-[15px] w-[15px]" aria-hidden />
            </button>
          )}

          {/* Send */}
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            aria-label={isStreaming ? 'Enviando...' : 'Enviar mensaje'}
            className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              'transition-colors duration-150 focus:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]',
              canSend
                ? 'bg-[color:var(--v2-brand-navy,#0E2A5E)] text-white hover:bg-[color:var(--v2-brand-navy-hover,#0a2049)]'
                : 'bg-[color:var(--v2-bg-muted,#E8E7E1)] text-[color:var(--v2-text-disabled,#B8B6AF)] cursor-not-allowed',
            ].join(' ')}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* ── Hint footer ── */}
      <div
        className="px-4 pb-2 text-[10px] text-[color:var(--v2-text-disabled,#B8B6AF)] select-none transition-opacity duration-150"
        style={{ opacity: isFocused ? 1 : 0 }}
      >
        Enter para enviar &middot; Shift+Enter nueva linea &middot; ⌘K comandos
      </div>
    </div>
  );
}
