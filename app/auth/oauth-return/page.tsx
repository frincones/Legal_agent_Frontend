'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PROVIDER_LABELS: Record<string, string> = {
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
  docusign: 'DocuSign',
  google: 'Google Calendar',
  outlook: 'Outlook',
  gmail: 'Gmail',
};

// Suspense wrapper requerido por Next.js 14 cuando usamos useSearchParams
// durante static prerender. Sin esto, el build falla con
// "useSearchParams() should be wrapped in a suspense boundary".
export default function OAuthReturnPage() {
  return (
    <Suspense fallback={<ProcessingView />}>
      <OAuthReturnInner />
    </Suspense>
  );
}

function OAuthReturnInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [phase, setPhase] = useState<'processing' | 'success' | 'error'>('processing');
  const [label, setLabel] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const ok = params.get('ok');
    const error = params.get('error');
    const provider = params.get('provider') || ok || '';
    const description = params.get('description');
    const providerLabel = PROVIDER_LABELS[provider] || provider;
    setLabel(providerLabel);

    if (ok) {
      setPhase('success');
    } else if (error) {
      setPhase('error');
      setErrorMsg(description || error);
    } else {
      setPhase('error');
      setErrorMsg('Respuesta inesperada del proveedor OAuth');
    }

    const timer = setTimeout(() => {
      router.replace('/settings/integraciones');
    }, 1800);
    return () => clearTimeout(timer);
  }, [params, router]);

  if (phase === 'processing') return <ProcessingView />;
  if (phase === 'success') return <SuccessView label={label} />;
  return <ErrorView errorMsg={errorMsg} />;
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="surface w-full max-w-md p-8 text-center">{children}</div>
    </div>
  );
}

function ProcessingView() {
  return (
    <Container>
      <Spinner />
      <h1 className="serif mt-5 text-[20px] font-semibold">Procesando autorización…</h1>
      <p className="mt-2 text-[13px] text-ink-2">Un momento.</p>
    </Container>
  );
}

function SuccessView({ label }: { label: string }) {
  return (
    <Container>
      <SuccessIcon />
      <h1 className="serif mt-5 text-[20px] font-semibold">
        {label} conectado correctamente
      </h1>
      <p className="mt-2 text-[13px] text-ink-2">
        Redirigiendo a configuración…
      </p>
    </Container>
  );
}

function ErrorView({ errorMsg }: { errorMsg: string }) {
  return (
    <Container>
      <ErrorIcon />
      <h1 className="serif mt-5 text-[20px] font-semibold">No se pudo conectar</h1>
      <p className="mt-2 text-[13px] text-ink-2 break-words">{errorMsg}</p>
      <p className="mt-3 text-[12px] text-ink-3">
        Redirigiendo a configuración para reintentar…
      </p>
    </Container>
  );
}

function Spinner() {
  return (
    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent-soft border-t-accent" />
  );
}

function SuccessIcon() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft">
      <svg className="h-6 w-6 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
      <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}
