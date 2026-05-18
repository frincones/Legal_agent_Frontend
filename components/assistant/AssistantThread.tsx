'use client';

/**
 * AssistantThread — unified transcript of voice + chat turns.
 *
 * Per V8 spec: voice and chat messages share a single timeline. Channel is
 * indicated by a small icon (🎙 voice / 💬 chat) on the user-side bubble.
 * Partial transcripts (voice ASR) render in italics until committed.
 *
 * Sprint 1 scope: render messages only. Action cards, task cards, and the
 * activity timeline live in their own slots inside AssistantSidebar.
 */

import { useEffect, useRef } from 'react';
import { useAssistantStore } from '@/lib/stores/assistant-store';
import type { Citation, Message } from '@/lib/assistant/types';
import { MarkdownContent } from './MarkdownContent';
import { ThinkingStep } from './ThinkingStep';

function CitationChip({ citation }: { citation: Citation }) {
  const colorClass = {
    verified: 'bg-ok-soft text-ok border-ok/30',
    pending: 'bg-warn-soft text-warn border-warn/30',
    derogated: 'bg-danger-soft text-danger border-danger/30',
    unknown: 'bg-bg-sunken text-ink-3 border-line',
  }[citation.status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] ${colorClass}`}
      title={`Estado: ${citation.status}${citation.source ? ` · ${citation.source}` : ''}`}
    >
      {citation.ref}
      {citation.status === 'verified' && (
        <span aria-hidden>✓</span>
      )}
      {citation.status === 'derogated' && (
        <span aria-hidden>!</span>
      )}
    </span>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const isVoice = msg.channel === 'voice';

  if (isUser) {
    // User messages stay as compact right-aligned bubbles.
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="text-ink-3 flex items-center gap-1 px-1 text-[10px]">
          <span aria-hidden>{isVoice ? 'voz' : 'chat'}</span>
          <span>· Tú</span>
        </div>
        <div className="bg-accent-soft text-accent-ink max-w-[88%] rounded-md px-3 py-2 text-[13px] leading-relaxed">
          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
        </div>
      </div>
    );
  }

  // Assistant messages render full-width (no bubble) for an article-like feel
  // matching Claude Cowork. Markdown gets a real renderer with sections,
  // tables, code chips, etc.
  return (
    <article className="flex flex-col gap-2">
      {msg.thinking && <ThinkingStep trace={msg.thinking} />}
      <div className="text-ink-3 flex items-center gap-1 px-0 text-[10px]">
        <span className="text-ink-2 font-medium">Lex</span>
        {isVoice && <span>· voz</span>}
        {msg.isPartial && (
          <span className="text-ink-3 italic">· escribiendo…</span>
        )}
      </div>
      {msg.content ? (
        <div className="text-ink">
          <MarkdownContent source={msg.content} />
        </div>
      ) : (
        <div className="text-ink-3 italic text-[12px]">…</div>
      )}
      {msg.citations && msg.citations.length > 0 && (
        <div className="border-line mt-1 flex flex-wrap gap-1 border-t pt-2">
          {msg.citations.map((c, i) => (
            <CitationChip key={`${c.ref}-${i}`} citation={c} />
          ))}
        </div>
      )}
    </article>
  );
}

function EmptyState() {
  const context = useAssistantStore((s) => s.context);
  const suggestion =
    context?.area === 'matter'
      ? '“¿Cuál es el plazo de contestación?”\n“Redacta una demanda por despido”\n“Resume el caso”'
      : context?.area === 'matters_list'
      ? '“Casos con plazos esta semana”\n“Reporte de demandas laborales”\n“Buscar casos de Bavaria”'
      : '“Buscar jurisprudencia sobre…”\n“Verifica la vigencia del art. X”\n“Explícame esta norma”';

  return (
    <div className="text-ink-3 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="text-2xl" aria-hidden>✨</div>
      <p className="text-sm">¿En qué te ayudo?</p>
      <pre className="text-ink-3 whitespace-pre-wrap text-left text-xs font-sans leading-relaxed opacity-80">
        {suggestion}
      </pre>
    </div>
  );
}

export function AssistantThread() {
  const thread = useAssistantStore((s) => s.thread);
  const partialTranscript = useAssistantStore((s) => s.partialTranscript);
  const mode = useAssistantStore((s) => s.mode);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or partial transcript update.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread.length, partialTranscript]);

  const showEmpty = thread.length === 0 && !partialTranscript;

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-4"
      aria-live="polite"
    >
      {showEmpty ? (
        <EmptyState />
      ) : (
        <>
          {thread.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          {partialTranscript && (
            <MessageBubble
              msg={{
                id: 'partial',
                role: 'user',
                channel: mode === 'voice' ? 'voice' : 'chat',
                content: partialTranscript,
                isPartial: true,
                createdAt: Date.now(),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
