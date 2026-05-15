'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { createClient } from '@/lib/supabase/client';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm muted">Cargando…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/inicio';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Bienvenida de vuelta');
      router.replace(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error de inicio de sesión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[440px]">
      <h1 className="serif m-[0_0_4px] text-[28px] -tracking-[0.02em]">Bienvenida de vuelta</h1>
      <p className="m-[0_0_20px] text-[13.5px] muted">Continuemos donde dejaste · LexAI</p>

      <GoogleSignInButton label="Continuar con Google" next={next} />

      <div className="my-5 flex items-center gap-3 text-[11px] muted">
        <div className="flex-1 h-px bg-line" />
        <span>o ingresa con email</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <Field label="Email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent outline-none"
          autoComplete="email"
        />
      </Field>
      <Field label="Contraseña">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent outline-none"
          autoComplete="current-password"
        />
      </Field>

      <div className="mt-5 rounded-md border border-line bg-bg-elev p-[14px]">
        <div className="mb-[10px] flex items-center gap-2">
          <span className="inline-flex text-ok">{Ic.shield}</span>
          <span className="text-[13px] font-semibold">MFA TOTP obligatorio</span>
          <span className="chip chip-green ml-auto">Activo</span>
        </div>
        <div className="text-[11.5px] leading-relaxed muted">
          Después de tu contraseña te pediremos el código TOTP de tu autenticador.
          Cumplimos Habeas Data (Ley 1581/2012) y zero data retention con OpenAI.
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-[18px] w-full justify-center">
        {busy ? 'Verificando…' : <>Entrar a LexAI {Ic.arrow}</>}
      </button>

      <div className="mt-3 text-center text-[12px] muted">
        ¿Sin cuenta?{' '}
        <Link href="/signup" className="text-accent hover:underline">
          Crea una en 60 segundos
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px]">
      <label className="mb-[6px] block text-[11.5px] font-semibold uppercase tracking-wider muted">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
