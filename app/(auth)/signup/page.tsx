'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { createClient } from '@/lib/supabase/client';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [tarjetaProfesional, setTarjeta] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            cedula_profesional: tarjetaProfesional,
          },
        },
      });
      if (error) throw error;
      toast.success('Cuenta creada. Verifica tu email para continuar.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear cuenta');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[440px]">
      <h1 className="serif m-[0_0_4px] text-[28px] -tracking-[0.02em]">Crea tu cuenta</h1>
      <p className="m-[0_0_20px] text-[13.5px] muted">
        14 días gratis · sin tarjeta de crédito · cancela cuando quieras.
      </p>

      <GoogleSignInButton label="Continuar con Google" />

      <div className="my-5 flex items-center gap-3 text-[11px] muted">
        <div className="flex-1 h-px bg-line" />
        <span>o regístrate con email</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <Field label="Nombre completo">
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </Field>
      <Field
        label="Tarjeta profesional (opcional · valida luego)"
        badge={tarjetaProfesional && <span className="chip chip-green"><span className="dot" />Por verificar</span>}
      >
        <input
          type="text"
          placeholder="123456 (puedes agregarla después)"
          value={tarjetaProfesional}
          onChange={(e) => setTarjeta(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </Field>
      <Field label="Email corporativo">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </Field>
      <Field label="Contraseña (mín. 12 caracteres)">
        <input
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </Field>

      <div className="mt-5 rounded-md border border-line bg-bg-elev p-[14px]">
        <div className="mb-[10px] flex items-center gap-2">
          <span className="inline-flex text-ok">{Ic.shield}</span>
          <span className="text-[13px] font-semibold">MFA TOTP obligatorio</span>
        </div>
        <div className="text-[11.5px] leading-relaxed muted">
          Te pediremos configurar autenticador (Google Authenticator / 1Password) en el siguiente paso.
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-[18px] w-full justify-center">
        {busy ? 'Creando cuenta…' : <>Iniciar 14 días gratis {Ic.arrow}</>}
      </button>

      <div className="mt-3 text-center text-[11px] leading-relaxed muted">
        Tarjeta requerida. Sin cargos hasta el día 15. Cancelas con un click. Cumplimos Habeas Data
        Ley 1581/2012 · Aviso de Privacidad · DPA disponible.
      </div>

      <div className="mt-3 text-center text-[12px] muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Inicia sesión
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-[14px]">
      <label className="mb-[6px] block text-[11.5px] font-semibold uppercase tracking-wider muted">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px] focus-within:border-accent">
        {children}
        {badge}
      </div>
    </div>
  );
}
