'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/atoms/Logo';
import { cn } from '@/lib/utils';

type Choice = null | 'create' | 'join';

export function JoinOrCreateFirm({ userName }: { userName: string }) {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice>(null);
  const [busy, setBusy] = useState(false);

  // Create form
  const [razonSocial, setRazonSocial] = useState('');
  const [country, setCountry] = useState('co');

  // Join form
  const [code, setCode] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!razonSocial.trim() || razonSocial.length < 2) {
      toast.error('Razón social mínimo 2 caracteres');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/me/create-firm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          razon_social: razonSocial.trim(),
          country,
          role: 'independiente',
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.detail || 'No se pudo crear la firma');
      }
      toast.success('Despacho creado · refrescando sesión…');
      // Necesitamos refrescar la sesión para que el JWT incluya firm_id
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.refreshSession();
      router.replace('/wizard');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      toast.error('Código mínimo 4 caracteres');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/me/join-firm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.detail?.message || data?.detail || 'Código inválido o expirado');
      }
      toast.success('¡Te uniste al despacho!');
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.refreshSession();
      router.replace('/wizard');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[520px]">
        <header className="mb-8 flex items-center gap-3">
          <Logo size={20} />
          <span className="serif text-[14px] font-semibold">LexAI · Configuración inicial</span>
        </header>

        <h1 className="serif mb-2 text-[28px] font-semibold leading-tight">
          Hola{userName ? `, ${userName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="mb-8 text-[13.5px] text-ink-2">
          Antes de empezar, dinos cómo quieres trabajar en LexAI.
        </p>

        {choice === null && (
          <div className="grid gap-3">
            <button
              onClick={() => setChoice('create')}
              className="surface flex items-start gap-4 p-5 text-left transition hover:border-accent hover:shadow-1"
            >
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                <Building2 size={18} />
              </span>
              <div className="flex-1">
                <h3 className="serif text-[16px] font-semibold">Crear nuevo despacho</h3>
                <p className="mt-1 text-[12.5px] muted leading-relaxed">
                  Soy abogado independiente o quiero ser el primer usuario de mi firma.
                  Inicio mi cuenta · 14 días gratis · sin tarjeta.
                </p>
              </div>
              <ArrowRight size={16} className="mt-2 shrink-0 text-ink-3" />
            </button>

            <button
              onClick={() => setChoice('join')}
              className="surface flex items-start gap-4 p-5 text-left transition hover:border-accent hover:shadow-1"
            >
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-soft text-purple">
                <Users size={18} />
              </span>
              <div className="flex-1">
                <h3 className="serif text-[16px] font-semibold">Unirme a un despacho existente</h3>
                <p className="mt-1 text-[12.5px] muted leading-relaxed">
                  Recibí un código de invitación de mi firma · me uno como abogado, paralegal o secretaria.
                </p>
              </div>
              <ArrowRight size={16} className="mt-2 shrink-0 text-ink-3" />
            </button>
          </div>
        )}

        {choice === 'create' && (
          <form onSubmit={handleCreate} className="grid gap-4 surface p-5">
            <header className="flex items-center gap-2">
              <Building2 size={18} className="text-accent" />
              <h2 className="serif text-[18px] font-semibold">Nuevo despacho</h2>
            </header>

            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider muted">Nombre del despacho</span>
              <input
                className="input"
                placeholder="Ej. Despacho Pérez & Asociados · Mi despacho · Bufete Solar"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                required
                minLength={2}
              />
              <span className="text-[11px] muted">Puedes cambiarlo después en Configuración.</span>
            </label>

            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider muted">País</span>
              <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="co">🇨🇴 Colombia</option>
                <option value="mx">🇲🇽 México</option>
                <option value="hn">🇭🇳 Honduras</option>
                <option value="gt">🇬🇹 Guatemala</option>
              </select>
            </label>

            <div className="flex gap-2 mt-2">
              <button type="button" className="btn btn-ghost" onClick={() => setChoice(null)}>
                Volver
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center">
                {busy && <Loader2 size={14} className="animate-spin" />}
                {busy ? 'Creando…' : 'Crear despacho'}
              </button>
            </div>
          </form>
        )}

        {choice === 'join' && (
          <form onSubmit={handleJoin} className="grid gap-4 surface p-5">
            <header className="flex items-center gap-2">
              <Users size={18} className="text-purple" />
              <h2 className="serif text-[18px] font-semibold">Código de invitación</h2>
            </header>

            <label className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider muted">Pega el código</span>
              <input
                className="input mono uppercase text-center text-[16px] tracking-wider"
                placeholder="ABCD-1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                minLength={4}
                maxLength={32}
              />
              <span className="text-[11px] muted">
                Si no tienes código, pídele al admin de tu firma que genere uno en
                <code className="mx-1 mono">Configuración → Usuarios</code>.
              </span>
            </label>

            <div className="flex gap-2 mt-2">
              <button type="button" className="btn btn-ghost" onClick={() => setChoice(null)}>
                Volver
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center">
                {busy && <Loader2 size={14} className="animate-spin" />}
                {busy ? 'Validando…' : 'Unirme al despacho'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
