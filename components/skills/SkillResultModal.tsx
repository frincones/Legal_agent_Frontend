'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Copy, ExternalLink, Loader2, Sparkles, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export type SkillResultData = {
  ok: boolean;
  execution_id?: string;
  command: string;
  skill_name?: string;
  duration_ms?: number;
  tokens?: { input: number; output: number };
  output: Record<string, unknown>;
  warnings?: Array<{ hook?: string; level?: string; reason?: string }>;
};

/** Render simple markdown -> HTML for canvas seeding.
 *  Soporta: párrafos, **bold**, *italic*, # H1/## H2/### H3, listas - / 1. y saltos.
 *  Intencional: NO usar lib externa · suficiente para drafts legales. */
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  const flushLists = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      out.push('</ol>');
      inOl = false;
    }
  };
  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushLists();
      out.push('<p></p>');
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = /^###\s+(.*)$/.exec(line))) {
      flushLists();
      out.push(`<h3>${inline(m[1]!)}</h3>`);
      continue;
    }
    if ((m = /^##\s+(.*)$/.exec(line))) {
      flushLists();
      out.push(`<h2>${inline(m[1]!)}</h2>`);
      continue;
    }
    if ((m = /^#\s+(.*)$/.exec(line))) {
      flushLists();
      out.push(`<h1>${inline(m[1]!)}</h1>`);
      continue;
    }
    if ((m = /^[-*]\s+(.*)$/.exec(line))) {
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${inline(m[1]!)}</li>`);
      continue;
    }
    if ((m = /^\d+\.\s+(.*)$/.exec(line))) {
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol>');
        inOl = true;
      }
      out.push(`<li>${inline(m[1]!)}</li>`);
      continue;
    }
    flushLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  flushLists();
  return out.join('\n');
}

function extractText(output: Record<string, unknown>): string {
  if (typeof output.text === 'string') return output.text;
  if (typeof output.draft === 'string') return output.draft;
  if (typeof output.content === 'string') return output.content;
  if (typeof output.summary === 'string') return output.summary;
  // Estructurados (review/contrato) · serializar legible
  if (Array.isArray((output as { clauses?: unknown[] }).clauses)) {
    const o = output as {
      summary?: string;
      risk_score?: number;
      clauses?: Array<{ title?: string; severity?: string; reason?: string; suggested_text?: string }>;
      missing_clauses?: string[];
    };
    const parts: string[] = [];
    if (o.summary) parts.push(`## Resumen\n\n${o.summary}\n`);
    if (typeof o.risk_score === 'number') parts.push(`**Score de riesgo:** ${o.risk_score}\n`);
    if (o.missing_clauses?.length) {
      parts.push(`### Cláusulas faltantes\n`);
      for (const c of o.missing_clauses) parts.push(`- ${c}`);
      parts.push('');
    }
    if (o.clauses?.length) {
      parts.push(`### Cláusulas revisadas\n`);
      for (const c of o.clauses) {
        const sev = c.severity ? `[${c.severity.toUpperCase()}] ` : '';
        parts.push(`**${sev}${c.title ?? 'Cláusula'}**`);
        if (c.reason) parts.push(c.reason);
        if (c.suggested_text) parts.push(`> Sugerencia: ${c.suggested_text}`);
        parts.push('');
      }
    }
    return parts.join('\n');
  }
  return JSON.stringify(output, null, 2);
}

export function SkillResultModal({
  data,
  matterId,
  open,
  onOpenChange,
}: {
  data: SkillResultData | null;
  matterId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<'copy' | 'canvas' | null>(null);

  if (!data) return null;
  const text = extractText(data.output);
  const skillName = data.skill_name || data.command;

  async function copy() {
    setSubmitting('copy');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar');
    } finally {
      setSubmitting(null);
    }
  }

  async function openInCanvas() {
    setSubmitting('canvas');
    try {
      const html = markdownToHtml(text);
      const res = await fetch(`/api/matter-documents/canvas?matter_id=${matterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t.slice(0, 160) || `HTTP ${res.status}`);
      }
      toast.success('Cargado en Canvas');
      onOpenChange(false);
      router.push(`/casos/${matterId}/canvas`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo abrir en Canvas');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby="skill-result-desc"
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(880px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-line bg-bg shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-line p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <Dialog.Title className="serif text-[16px] font-semibold">
                Resultado · {skillName}
              </Dialog.Title>
            </div>
            <Dialog.Close className="btn btn-ghost btn-sm" aria-label="Cerrar">
              <X size={14} />
            </Dialog.Close>
          </header>
          <Dialog.Description id="skill-result-desc" className="sr-only">
            Resultado de la skill ejecutada con opciones para copiar o cargar en Canvas
          </Dialog.Description>

          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-bg-sunken px-4 py-2 text-[11.5px] muted">
            <span className="inline-flex items-center gap-1 text-ok">
              <CheckCircle2 size={12} /> Completada
            </span>
            {typeof data.duration_ms === 'number' && (
              <>
                <span>·</span>
                <span>{(data.duration_ms / 1000).toFixed(1)}s</span>
              </>
            )}
            {data.tokens && (
              <>
                <span>·</span>
                <span>
                  {(data.tokens.input + data.tokens.output).toLocaleString('es-CO')} tokens
                </span>
              </>
            )}
            {data.execution_id && (
              <>
                <span>·</span>
                <span className="mono">{data.execution_id.slice(0, 8)}</span>
              </>
            )}
          </div>

          {data.warnings && data.warnings.length > 0 && (
            <div className="border-b border-line bg-warn-soft px-4 py-2 text-[12.5px]">
              <div className="mb-1 flex items-center gap-1 font-semibold text-warn">
                <AlertTriangle size={12} /> {data.warnings.length} advertencia(s) de hooks
              </div>
              <ul className="ml-4 list-disc">
                {data.warnings.map((w, i) => (
                  <li key={i}>
                    <strong>{w.hook}:</strong> {w.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4">
            <pre className="whitespace-pre-wrap break-words rounded-md bg-bg-sunken p-4 font-sans text-[13px] leading-[1.6] text-ink-1">
{text}
            </pre>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-line p-3">
            <button
              type="button"
              className="btn btn-md"
              onClick={copy}
              disabled={!!submitting}
            >
              {submitting === 'copy' ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
              Copiar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-md"
              onClick={openInCanvas}
              disabled={!!submitting}
            >
              {submitting === 'canvas' ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
              Abrir en Canvas
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
