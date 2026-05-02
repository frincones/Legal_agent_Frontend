'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';

const FINALIDADES = [
  'representacion_legal',
  'comunicaciones',
  'facturacion',
  'analisis_caso',
  'voz_recordatorios',
] as const;

const FINALIDAD_LABEL: Record<(typeof FINALIDADES)[number], string> = {
  representacion_legal: 'Representación legal',
  comunicaciones: 'Comunicaciones',
  facturacion: 'Facturación',
  analisis_caso: 'Análisis del caso',
  voz_recordatorios: 'Recordatorios por voz',
};

export function NewClientForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [tipo, setTipo] = useState<'persona_natural' | 'persona_juridica'>('persona_natural');
  const [nombre, setNombre] = useState('');
  const [taxId, setTaxId] = useState('');
  const [personalId, setPersonalId] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [vip, setVip] = useState(false);
  const [consent, setConsent] = useState(true);
  const [finalidades, setFinalidades] = useState<Set<string>>(
    new Set(['representacion_legal', 'comunicaciones']),
  );
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [busy, setBusy] = useState(false);

  // F1 · prefill API
  useEffect(() => {
    return uiCommandBus.registerForm('new_client', {
      setValues: (partial) => {
        if (typeof partial.tipo === 'string' && ['persona_natural', 'persona_juridica'].includes(partial.tipo))
          setTipo(partial.tipo as 'persona_natural' | 'persona_juridica');
        if (typeof partial.nombre === 'string') setNombre(partial.nombre);
        if (typeof partial.taxId === 'string') setTaxId(partial.taxId);
        if (typeof partial.personalId === 'string') setPersonalId(partial.personalId);
        if (typeof partial.email === 'string') setEmail(partial.email);
        if (typeof partial.telefono === 'string') setTelefono(partial.telefono);
        if (typeof partial.vip === 'boolean') setVip(partial.vip);
      },
      submit: () => formRef.current?.requestSubmit(),
    });
  }, []);

  function toggleFinalidad(f: string) {
    setFinalidades((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) {
      toast.error('Escribe el nombre completo del cliente.');
      return;
    }
    if (!taxId && !personalId) {
      toast.error('Captura NIT o cédula.');
      return;
    }
    if (!consent) {
      toast.error('El consentimiento Habeas Data es obligatorio (Ley 1581/2012).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo,
          nombre: nombre.trim(),
          tax_id: taxId.trim() || null,
          personal_id: personalId.trim() || null,
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          vip,
          consent_lfpdppp: consent,
          consent_finalidades: Array.from(finalidades),
          consent_voice_recording: voiceRecording,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 200) || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { id: string };
      toast.success(`Cliente registrado`);
      router.push(`/clientes/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error creando cliente');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Tipo de persona">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="w-full bg-transparent outline-none"
          >
            <option value="persona_natural">Persona natural</option>
            <option value="persona_juridica">Persona jurídica</option>
          </select>
        </Field>
        <Field label={tipo === 'persona_juridica' ? 'NIT' : 'Cédula de ciudadanía'}>
          <input
            type="text"
            value={tipo === 'persona_juridica' ? taxId : personalId}
            onChange={(e) =>
              tipo === 'persona_juridica' ? setTaxId(e.target.value) : setPersonalId(e.target.value)
            }
            placeholder={tipo === 'persona_juridica' ? '900.123.456-7' : '41.123.456'}
            className="w-full bg-transparent outline-none"
          />
        </Field>
      </div>

      <Field label="Nombre completo / Razón social">
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="María Rodríguez Velázquez"
          className="w-full bg-transparent outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@correo.com"
            className="w-full bg-transparent outline-none"
          />
        </Field>
        <Field label="Teléfono">
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+57 310 123 4567"
            className="w-full bg-transparent outline-none"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[12.5px]">
        <input type="checkbox" checked={vip} onChange={(e) => setVip(e.target.checked)} />
        Cliente VIP
      </label>

      <fieldset className="rounded-md border border-line p-3">
        <legend className="px-2 text-[11.5px] font-semibold uppercase tracking-wider muted">
          Habeas Data · Ley 1581/2012
        </legend>
        <label className="flex items-start gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            El cliente otorgó consentimiento informado para el tratamiento de sus datos personales
            con las finalidades seleccionadas (Decreto 1377/2013).
          </span>
        </label>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FINALIDADES.map((f) => (
            <label key={f} className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={finalidades.has(f)}
                onChange={() => toggleFinalidad(f)}
              />
              {FINALIDAD_LABEL[f]}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-start gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={voiceRecording}
            onChange={(e) => setVoiceRecording(e.target.checked)}
            className="mt-1"
          />
          <span>Autorización para grabación de voz (consultas y dictados).</span>
        </label>
      </fieldset>

      <div className="flex gap-2">
        <button type="button" onClick={() => router.back()} className="btn">
          Cancelar
        </button>
        <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center">
          {busy ? 'Creando…' : <>Registrar cliente {Ic.arrow}</>}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wider muted">
        {label}
      </label>
      <div className="rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
