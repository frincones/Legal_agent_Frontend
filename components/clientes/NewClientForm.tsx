'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Ic } from '@/components/atoms/icons';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';

type ConflictHit = {
  kind: string;
  client_id?: string;
  matter_id?: string;
  severity: 'low' | 'medium' | 'high';
  detail: string;
  matched_value?: string;
};

type ConflictReport = {
  has_conflict: boolean;
  hits: ConflictHit[];
};

type PersoneriaResponse = {
  nit: string;
  razon_social: string | null;
  estado: string | null;
  matricula: string | null;
  camara: string | null;
  fuente: string;
  fuente_url: string | null;
  found: boolean;
};

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
  // Sprint 2 · S2-04 conflict + S2-05 personería
  const [conflictReport, setConflictReport] = useState<ConflictReport | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [personeria, setPersoneria] = useState<PersoneriaResponse | null>(null);
  const [personeriaBusy, setPersoneriaBusy] = useState(false);

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

  // S2-04 · run the conflict-of-interest check before persisting.
  // Returns true if user can proceed (no conflict OR confirmed override).
  const runConflictCheck = useCallback(async (): Promise<boolean> => {
    setConflictBusy(true);
    try {
      const res = await fetch('/api/clients/check-conflict', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo,
          nombre: nombre.trim(),
          tax_id: taxId.trim() || null,
          personal_id: personalId.trim() || null,
        }),
      });
      if (!res.ok) {
        // Don't block creation if the check itself fails — log and proceed.
        console.warn('[conflict-check] failed:', await res.text());
        return true;
      }
      const report = (await res.json()) as ConflictReport;
      setConflictReport(report);
      const hasHigh = report.hits.some((h) => h.severity === 'high');
      if (hasHigh || report.hits.length > 0) {
        setPendingSubmit(true);
        setConflictDialogOpen(true);
        return false; // wait for user decision via dialog
      }
      return true;
    } catch (e) {
      console.warn('[conflict-check] error:', e);
      return true; // fail open
    } finally {
      setConflictBusy(false);
    }
  }, [tipo, nombre, taxId, personalId]);

  // S2-05 · validate Personería Jurídica via RUES (only for empresas).
  const runPersoneriaCheck = useCallback(async () => {
    if (!taxId.trim()) {
      toast.warning('Ingresa el NIT antes de validar.');
      return;
    }
    setPersoneriaBusy(true);
    try {
      const res = await fetch(
        `/api/clients/validate-personeria?nit=${encodeURIComponent(taxId.trim())}`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      const data = (await res.json()) as PersoneriaResponse;
      setPersoneria(data);
      if (data.found) {
        toast.success(`RUES: ${data.razon_social ?? 'NIT válido'}`);
        if (data.razon_social && nombre.trim().length === 0) {
          setNombre(data.razon_social);
        }
      } else {
        toast.info('RUES respondió pero no se pudo extraer la razón social. Ver detalle.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo validar contra RUES');
    } finally {
      setPersoneriaBusy(false);
    }
  }, [taxId, nombre]);

  async function actuallyCreate() {
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
    // S2-04 · run conflict check; if it returns false, dialog opens and
    // we wait for the user to decide via the dialog action.
    const ok = await runConflictCheck();
    if (!ok) return;
    await actuallyCreate();
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tipo === 'persona_juridica' ? taxId : personalId}
              onChange={(e) =>
                tipo === 'persona_juridica' ? setTaxId(e.target.value) : setPersonalId(e.target.value)
              }
              placeholder={tipo === 'persona_juridica' ? '900.123.456-7' : '41.123.456'}
              className="w-full bg-transparent outline-none"
            />
            {tipo === 'persona_juridica' && (
              <button
                type="button"
                onClick={() => void runPersoneriaCheck()}
                disabled={personeriaBusy || !taxId.trim()}
                className="btn btn-sm flex-none"
                title="Validar Personería Jurídica en RUES (Cámaras de Comercio)"
              >
                {personeriaBusy ? (
                  <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Building2 size={11} aria-hidden="true" />
                )}
                Validar RUES
              </button>
            )}
          </div>
        </Field>
      </div>

      {tipo === 'persona_juridica' && personeria && (
        <div
          className={
            personeria.found
              ? 'rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-[12.5px]'
              : 'rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-[12.5px]'
          }
        >
          <div className="flex items-center gap-2 font-medium">
            {personeria.found ? (
              <CheckCircle2 size={14} className="text-emerald-500" aria-hidden="true" />
            ) : (
              <AlertTriangle size={14} className="text-amber-500" aria-hidden="true" />
            )}
            {personeria.found ? 'Personería válida en RUES' : 'No se encontró en RUES'}
          </div>
          {personeria.razon_social && (
            <div className="mt-1">
              <strong>Razón social:</strong> {personeria.razon_social}
            </div>
          )}
          {personeria.estado && (
            <div className="mt-0.5">
              <strong>Estado:</strong> {personeria.estado}
            </div>
          )}
          {personeria.matricula && (
            <div className="mt-0.5">
              <strong>Matrícula:</strong> {personeria.matricula}
              {personeria.camara ? ` · ${personeria.camara}` : ''}
            </div>
          )}
          {personeria.fuente_url && (
            <a
              href={personeria.fuente_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-accent hover:underline"
            >
              Ver registro completo →
            </a>
          )}
        </div>
      )}

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
        <button
          type="submit"
          disabled={busy || conflictBusy}
          className="btn btn-primary flex-1 justify-center"
        >
          {busy ? 'Creando…' : conflictBusy ? 'Verificando conflictos…' : <>Registrar cliente {Ic.arrow}</>}
        </button>
      </div>

      <ConflictDialog
        open={conflictDialogOpen}
        report={conflictReport}
        busy={busy}
        onCancel={() => {
          setConflictDialogOpen(false);
          setPendingSubmit(false);
        }}
        onConfirm={async () => {
          setConflictDialogOpen(false);
          if (pendingSubmit) {
            setPendingSubmit(false);
            await actuallyCreate();
          }
        }}
      />
    </form>
  );
}

function ConflictDialog({
  open,
  report,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  report: ConflictReport | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const hits = report?.hits ?? [];
  const hasHigh = hits.some((h) => h.severity === 'high');
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
          <Dialog.Title className="serif flex items-center gap-2 text-[18px] font-semibold">
            <AlertTriangle size={16} className={hasHigh ? 'text-red-500' : 'text-amber-500'} aria-hidden="true" />
            {hasHigh ? 'Posible conflicto de interés' : 'Coincidencias detectadas'}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            {hasHigh
              ? 'Este cliente coincide con la contraparte de un caso anterior. Revisa antes de continuar.'
              : 'Encontramos clientes parecidos en la firma. Revisa para evitar duplicados.'}
          </Dialog.Description>
          <ul className="mt-3 space-y-2">
            {hits.map((h, i) => (
              <li
                key={i}
                className={
                  h.severity === 'high'
                    ? 'rounded-md border border-red-500/40 bg-red-500/5 p-3 text-[12.5px]'
                    : h.severity === 'medium'
                      ? 'rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-[12.5px]'
                      : 'rounded-md border border-line bg-bg-elev p-3 text-[12.5px]'
                }
              >
                <div className="font-medium">{h.detail}</div>
                {h.matched_value && (
                  <div className="mt-0.5 mono text-[11px] muted">{h.matched_value}</div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary ml-auto"
              onClick={() => void onConfirm()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : null}
              {busy ? 'Creando…' : 'Continuar de todos modos'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
