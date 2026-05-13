'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Array<{ document_id: string; titulo: string }>;
  created_at: string;
};

type Session = {
  session: {
    id: string;
    scope_kind: string;
    scope_document_ids: string[];
    title: string;
    message_count: number;
  };
  messages: Message[];
};

export function DocQADrawer({
  open,
  onOpenChange,
  scope,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  scope: { kind: 'document' | 'matter'; document_ids?: string[]; matter_id?: string; title?: string };
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [data, setData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Crear sesion al abrir
  useEffect(() => {
    if (!open) {
      setSessionId(null);
      setData(null);
      setDraft('');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/doc-qa/sessions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            scope_kind: scope.kind,
            scope_document_ids: scope.document_ids || [],
            matter_id: scope.matter_id || null,
            title: scope.title || 'Consulta',
          }),
        });
        if (!r.ok) throw new Error(await r.text());
        const d = await r.json();
        setSessionId(d.id);
        setData({ session: d, messages: [] });
      } catch (e) {
        toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, scope.kind, JSON.stringify(scope.document_ids), scope.matter_id]); // eslint-disable-line

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [data?.messages.length]);

  async function ask(e?: React.FormEvent) {
    e?.preventDefault();
    if (!sessionId || !draft.trim() || busy) return;
    const question = draft.trim();
    setDraft('');
    setBusy(true);
    // Optimistic
    setData((prev) => prev ? {
      ...prev,
      messages: [...prev.messages, {
        id: `tmp-${Date.now()}`, role: 'user', content: question, created_at: new Date().toISOString(),
      }],
    } : prev);
    try {
      const r = await fetch(`/api/doc-qa/sessions/${sessionId}/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setData((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, {
          id: d.id, role: 'assistant', content: d.answer,
          citations: d.citations, created_at: new Date().toISOString(),
        }],
      } : prev);
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const suggestions = [
    'Resume el documento en 5 líneas',
    '¿Cuáles son las obligaciones del contratista?',
    '¿Hay alguna cláusula desfavorable para mi cliente?',
    '¿Cuáles son las fechas clave?',
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-screen w-[520px] max-w-[95vw] flex-col border-l border-line bg-bg p-0 shadow-2xl">
          <header className="border-b border-line p-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Bot size={16} className="text-accent" aria-hidden="true" />
              <Dialog.Title className="serif text-[15px] font-semibold">Pregunta al documento</Dialog.Title>
            </div>
            <button className="btn" onClick={() => onOpenChange(false)}><X size={14} aria-hidden="true" /></button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            {loading && !data ? (
              <div className="flex items-center gap-2 text-[12.5px] muted">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Preparando sesión…
              </div>
            ) : (data?.messages.length || 0) === 0 ? (
              <div className="grid gap-3">
                <p className="text-[12.5px] muted">
                  Pregúntale a LexAI sobre <strong>{scope.title || 'el documento'}</strong>.
                  Las respuestas citan el documento original — no se inventa información.
                </p>
                <div className="grid gap-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setDraft(s)}
                      className="rounded-md border border-line bg-bg-elev p-2 text-left text-[12.5px] hover:border-accent"
                    >
                      <Sparkles size={10} className="mr-1 inline text-accent" aria-hidden="true" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="grid gap-3">
                {data?.messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      'rounded-md p-3',
                      m.role === 'user' ? 'ml-8 bg-accent/10 border border-accent/20' : 'mr-8 surface',
                    )}
                  >
                    <div className="text-[13px] whitespace-pre-wrap">{m.content}</div>
                    {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.citations.map((c, i) => (
                          <span key={c.document_id + i} className="rounded border border-line px-1.5 py-0.5 text-[10px]">
                            Doc {i + 1}: {c.titulo}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                {busy && (
                  <li className="surface mr-8 p-3 text-[12.5px] muted inline-flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Pensando…
                  </li>
                )}
              </ul>
            )}
          </div>

          <form onSubmit={ask} className="border-t border-line p-3 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe tu pregunta…"
              disabled={busy || !sessionId}
              className="flex-1 rounded-md border border-line bg-bg-elev p-2 text-[13px] outline-none focus:border-accent"
            />
            <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim() || !sessionId}>
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
