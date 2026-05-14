'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WizardStepRenderer, type WizardStep } from './WizardStepRenderer';
import { WizardReview } from './WizardReview';

type Session = {
  id: string;
  session_token: string;
  wizard_template_id: string;
  template_slug: string;
  template_name: string;
  template_steps: WizardStep[];
  template_brand_color: string | null;
  template_icon: string | null;
  template_legal_disclaimer: string | null;
  template_output_actions: string[];
  template_identity_validations: unknown[];
  answers: Record<string, unknown>;
  current_step: number;
  completed_steps: string[];
  status: string;
  generated_doc_text: string | null;
  document_title: string;
};

const STORAGE_KEY = 'lexai_wizard_token_';

export function WizardRunner({ slug, initialToken }: { slug: string; initialToken?: string }) {
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [advancing, setAdvancing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [docText, setDocText] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>('');

  // 1) Init: if no token, persist or create one
  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        // Cargar token de localStorage si existe
        let useToken = token;
        if (!useToken && typeof window !== 'undefined') {
          useToken = localStorage.getItem(STORAGE_KEY + slug);
        }
        if (useToken) {
          const r = await fetch(`/api/public/wizards/sessions/${useToken}`, { cache: 'no-store' });
          if (r.ok) {
            const data: Session = await r.json();
            if (!active) return;
            setSession(data);
            setValues(data.answers || {});
            setToken(useToken);
            return;
          }
          // Token inválido · limpiar
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY + slug);
          }
        }
        // No token o expirado · crear nuevo
        const cr = await fetch(`/api/public/wizards/${slug}/sessions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        });
        if (!cr.ok) {
          throw new Error('No se pudo iniciar el formulario');
        }
        const created = await cr.json();
        const newToken = created.session_token as string;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY + slug, newToken);
        }
        const r2 = await fetch(`/api/public/wizards/sessions/${newToken}`, { cache: 'no-store' });
        if (r2.ok) {
          const data: Session = await r2.json();
          if (!active) return;
          setSession(data);
          setToken(newToken);
          setValues(data.answers || {});
        }
      } catch (e) {
        if (active) toast.error(e instanceof Error ? e.message : 'Error al iniciar');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug, token]);

  function setVal(id: string, v: unknown) {
    setValues((p) => ({ ...p, [id]: v }));
  }

  async function advance() {
    if (!session || !token) return;
    setAdvancing(true);
    try {
      const r = await fetch(`/api/public/wizards/sessions/${token}/advance`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: values }),
      });
      if (r.ok) {
        const data = await r.json();
        // Refresca session
        const r2 = await fetch(`/api/public/wizards/sessions/${token}`, { cache: 'no-store' });
        if (r2.ok) {
          const fresh: Session = await r2.json();
          setSession(fresh);
        }
        if (data.is_last) {
          // Auto-generate document
          await generateDoc();
        }
      } else {
        const data = await r.json().catch(() => ({}));
        const errs = data?.detail?.errors || (typeof data?.detail === 'string' ? [data.detail] : ['Error']);
        toast.error(Array.isArray(errs) ? errs.join(' · ') : String(errs));
      }
    } finally {
      setAdvancing(false);
    }
  }

  const generateDoc = useCallback(async () => {
    if (!token) return;
    setGenerating(true);
    try {
      const r = await fetch(`/api/public/wizards/sessions/${token}/generate`, { method: 'POST' });
      if (r.ok) {
        const data = await r.json();
        setDocText(data.document_text || '');
        setDocTitle(data.document_title || '');
      } else {
        toast.error('No se pudo generar el documento');
      }
    } finally {
      setGenerating(false);
    }
  }, [token]);

  function goBack() {
    if (!session) return;
    if (session.current_step > 0) {
      setSession({ ...session, current_step: session.current_step - 1 });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-ink-3" size={28} />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="mx-auto mt-20 max-w-md p-6 text-center">
        <h2 className="serif text-[20px] font-semibold">No se pudo cargar el wizard</h2>
        <p className="mt-2 text-[12.5px] muted">Refresca la página o intenta más tarde.</p>
      </div>
    );
  }

  const steps = session.template_steps || [];
  const idx = session.current_step;
  const isCompleted = session.status === 'completed' || idx >= steps.length;

  // Pantalla final
  if (isCompleted || docText) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        {generating ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-accent" size={28} />
            <span className="ml-3 text-[14px] muted">Generando tu documento…</span>
          </div>
        ) : docText && token ? (
          <WizardReview
            token={token}
            documentTitle={docTitle || session.document_title || session.template_name}
            documentText={docText}
            outputActions={session.template_output_actions || ['download_docx']}
            legalDisclaimer={session.template_legal_disclaimer}
            brandColor={session.template_brand_color || 'blue'}
          />
        ) : (
          <button className="btn btn-primary btn-lg" onClick={generateDoc}>
            <Sparkles size={14} /> Generar mi documento
          </button>
        )}
      </div>
    );
  }

  const step = steps[idx];
  if (!step) {
    return (
      <div className="p-6 text-center">
        <p className="muted">Paso desconocido.</p>
      </div>
    );
  }

  const total = steps.length;
  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Progress */}
      <header className="mb-6">
        <div className="mb-2 flex items-center justify-between text-[11px] muted">
          <span>
            Paso {idx + 1} de {total} · {session.template_icon} {session.template_name}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-[6px] overflow-hidden rounded-full bg-bg-sunken">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <WizardStepRenderer step={step} values={values} onChange={setVal} />

      <footer className="mt-6 flex items-center justify-between">
        <button
          className="btn btn-ghost btn-md"
          onClick={goBack}
          disabled={idx === 0 || advancing}
        >
          <ArrowLeft size={14} /> Atrás
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={advance}
          disabled={advancing}
        >
          {advancing && <Loader2 className="animate-spin" size={14} />}
          {idx + 1 === total ? (
            <>
              <CheckCircle2 size={14} /> Finalizar y generar documento
            </>
          ) : (
            <>
              Siguiente <ArrowRight size={14} />
            </>
          )}
        </button>
      </footer>

      <p className="mt-6 text-center text-[10.5px] muted">
        Tu progreso se guarda automáticamente · puedes cerrar y volver luego en este mismo navegador.
      </p>
    </div>
  );
}
