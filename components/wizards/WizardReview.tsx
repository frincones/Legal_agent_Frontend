'use client';

import { useState } from 'react';
import { CheckCircle2, Download, FileText, Loader2, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Sprint 22 · Vista final del wizard · preview del doc + acciones.
 *
 * Acciones disponibles según output_actions:
 *   - download_docx
 *   - download_pdf  (cuando esté implementado · por ahora hace download_txt)
 *   - emailed_defensoria
 *   - lead_created  (si el wizard pertenece a un firm)
 */
export function WizardReview({
  token,
  documentTitle,
  documentText,
  outputActions,
  legalDisclaimer,
  brandColor = 'blue',
  className,
}: {
  token: string;
  documentTitle: string;
  documentText: string;
  outputActions: string[];
  legalDisclaimer?: string | null;
  brandColor?: string;
  className?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ action: string; lead_id?: string | null; email?: string | null } | null>(null);
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterPhone, setSubmitterPhone] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);

  async function submit(action: string) {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/public/wizards/sessions/${token}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          submitter_email: submitterEmail || null,
          submitter_name: submitterName || null,
          submitter_phone: submitterPhone || null,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setDone({ action: data.action, lead_id: data.lead_id, email: data.routed_to_email });
        toast.success('Acción registrada');
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.detail || 'No se pudo registrar la acción');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function downloadAsTxt() {
    const blob = new Blob([documentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugifyName(documentTitle)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    void submit('downloaded');
  }

  async function downloadAsDocx() {
    try {
      const { htmlToDocxBlob, suggestFilename } = await import('@/lib/docx/exportFromTipTap');
      // Convert plain text → simple HTML (paragraphs)
      const html =
        '<div>' +
        documentText
          .split('\n')
          .map((line) => line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p>&nbsp;</p>')
          .join('') +
        '</div>';
      const blob = await htmlToDocxBlob(html, { title: documentTitle });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestFilename(documentTitle);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      void submit('downloaded');
    } catch (err) {
      toast.error('No se pudo exportar a Word · descargando como texto');
      downloadAsTxt();
    }
  }

  if (done) {
    return (
      <div className={cn('flex flex-col items-center gap-3 p-8 text-center', className)}>
        <CheckCircle2 size={56} className="text-ok" />
        <h2 className="serif text-[24px] font-semibold">Listo</h2>
        <p className="text-[13px] muted max-w-md">
          {done.action === 'downloaded' && 'Documento descargado · ya puedes presentarlo.'}
          {done.action === 'emailed_defensoria' && `Documento enrutado a ${done.email || 'Defensoría del Pueblo'}.`}
          {done.action === 'lead_created' && 'Hemos asignado tu solicitud a un abogado del despacho. Te contactará pronto.'}
        </p>
        <p className="text-[11px] muted max-w-md mt-3">
          Para volver a ver este documento, guarda este link:
          <br />
          <code className="mono text-accent break-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/wizard/resume?token=${token}` : ''}
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <header>
        <h2 className="serif m-0 text-[20px] font-semibold">Tu documento está listo</h2>
        <p className="text-[12.5px] muted">
          Revisa el contenido. Si todo se ve bien, descárgalo o envíalo.
        </p>
      </header>

      <section className="rounded-md border border-line bg-bg-elev p-4">
        <header className="mb-2 flex items-center gap-2">
          <FileText size={14} className="text-accent" />
          <h3 className="serif m-0 text-[14px] font-semibold">{documentTitle}</h3>
        </header>
        <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink-2 font-serif">
          {documentText}
        </pre>
      </section>

      {legalDisclaimer && (
        <div className="rounded-md border-l-2 border-warn bg-warn-soft p-3 text-[11.5px] text-ink-2">
          {legalDisclaimer}
        </div>
      )}

      <section className="grid gap-2">
        <h3 className="m-0 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
          ¿Qué quieres hacer ahora?
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          {outputActions.includes('download_docx') && (
            <button
              className="btn btn-primary btn-md justify-center"
              onClick={downloadAsDocx}
              disabled={submitting}
            >
              <Download size={14} /> Descargar Word (.docx)
            </button>
          )}
          {(outputActions.includes('download_pdf') || outputActions.includes('download_txt')) && (
            <button
              className="btn btn-md justify-center"
              onClick={downloadAsTxt}
              disabled={submitting}
            >
              <Download size={14} /> Descargar texto plano
            </button>
          )}
          {outputActions.includes('emailed_defensoria') && (
            <button
              className="btn btn-md justify-center"
              onClick={() => submit('emailed_defensoria')}
              disabled={submitting}
            >
              <Mail size={14} /> Enviar a Defensoría del Pueblo
            </button>
          )}
          {outputActions.includes('lead_created') && (
            <button
              className="btn btn-md justify-center"
              onClick={() => setShowLeadForm(true)}
              disabled={submitting}
            >
              <Send size={14} /> Enviar a un abogado
            </button>
          )}
        </div>
      </section>

      {showLeadForm && (
        <section className="rounded-md border border-accent bg-accent-soft p-3">
          <h4 className="m-0 mb-2 text-[12.5px] font-semibold">Tus datos para contacto</h4>
          <div className="grid gap-2">
            <input
              className="input"
              placeholder="Tu nombre"
              value={submitterName}
              onChange={(ev) => setSubmitterName(ev.target.value)}
            />
            <input
              className="input"
              type="email"
              placeholder="Tu email"
              value={submitterEmail}
              onChange={(ev) => setSubmitterEmail(ev.target.value)}
            />
            <input
              className="input"
              type="tel"
              placeholder="Tu teléfono (opcional)"
              value={submitterPhone}
              onChange={(ev) => setSubmitterPhone(ev.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLeadForm(false)}>Cancelar</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => submit('lead_created')}
                disabled={submitting || !submitterEmail || !submitterName}
              >
                {submitting && <Loader2 className="animate-spin" size={12} />}
                Enviar
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugifyName(name: string): string {
  return (name || 'documento')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}
