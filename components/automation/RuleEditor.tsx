'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Rule = {
  id: string;
  name: string;
  description: string | null;
  trigger_kind: string;
  trigger_config: any;
  conditions: any[];
  actions: any[];
  active: boolean;
};

type Action = { kind: string; params: Record<string, any> };

const TRIGGER_OPTIONS = [
  { kind: 'matter_created', label: 'Cuando se crea un caso' },
  { kind: 'matter_stage_changed', label: 'Cuando un caso cambia de etapa' },
  { kind: 'deadline_due_in', label: 'Cuando un plazo se acerca' },
  { kind: 'client_created', label: 'Cuando se registra un cliente' },
  { kind: 'invoice_overdue', label: 'Cuando una factura está vencida' },
  { kind: 'lead_stage_changed', label: 'Cuando un lead cambia de etapa' },
  { kind: 'schedule_daily', label: 'Diariamente (cron)' },
  { kind: 'schedule_weekly', label: 'Semanalmente' },
];

const ACTION_OPTIONS = [
  { kind: 'create_deadline', label: 'Crear plazo', fields: ['titulo', 'tipo', 'days_from_trigger'] },
  { kind: 'create_alert', label: 'Crear alerta interna', fields: ['severity', 'title', 'body'] },
  { kind: 'log_note', label: 'Agregar nota al caso', fields: ['body'] },
  { kind: 'tag_matter', label: 'Etiquetar caso', fields: ['tag'] },
  { kind: 'send_whatsapp', label: 'Enviar WhatsApp', fields: ['to_phone', 'body'] },
  { kind: 'send_email', label: 'Enviar email (stub)', fields: ['to', 'subject', 'body'] },
];

export function RuleEditor({
  rule,
  onClose,
  onSaved,
}: {
  rule: Rule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [triggerKind, setTriggerKind] = useState(rule?.trigger_kind || 'matter_created');
  const [triggerConfig, setTriggerConfig] = useState<string>(JSON.stringify(rule?.trigger_config || {}, null, 2));
  const [actions, setActions] = useState<Action[]>(rule?.actions || [{ kind: 'log_note', params: { body: '' } }]);
  const [active, setActive] = useState<boolean>(rule?.active ?? true);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      let cfg: any = {};
      try {
        cfg = triggerConfig.trim() ? JSON.parse(triggerConfig) : {};
      } catch (e) {
        toast.error('JSON inválido en trigger_config');
        setBusy(false);
        return;
      }
      const body = {
        name, description: description || null,
        trigger_kind: triggerKind, trigger_config: cfg,
        conditions: [], actions, active,
      };
      const url = rule ? `/api/automation/rules/${rule.id}` : '/api/automation/rules';
      const method = rule ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method, headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success(rule ? 'Actualizada' : 'Creada');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function updateAction(idx: number, patch: Partial<Action>) {
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  function updateActionParam(idx: number, key: string, val: any) {
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, params: { ...a.params, [key]: val } } : a)));
  }

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[600px] max-w-[94vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold">
            {rule ? 'Editar regla' : 'Nueva regla'}
          </Dialog.Title>

          <div className="mt-4 grid gap-3">
            <Field label="Nombre">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Descripción">
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>

            <Field label="Trigger">
              <select value={triggerKind} onChange={(e) => setTriggerKind(e.target.value)} className="w-full bg-transparent outline-none">
                {TRIGGER_OPTIONS.map((t) => (<option key={t.kind} value={t.kind}>{t.label}</option>))}
              </select>
            </Field>

            <Field label="Configuración del trigger (JSON)">
              <textarea
                rows={3}
                value={triggerConfig}
                onChange={(e) => setTriggerConfig(e.target.value)}
                className="w-full bg-transparent outline-none font-mono text-[11.5px]"
                placeholder='{}'
              />
            </Field>

            <section>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider muted">Acciones</span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setActions((p) => [...p, { kind: 'log_note', params: { body: '' } }])}
                >
                  <Plus size={12} aria-hidden="true" /> Añadir acción
                </button>
              </div>
              <div className="grid gap-2">
                {actions.map((a, i) => {
                  const opt = ACTION_OPTIONS.find((o) => o.kind === a.kind);
                  return (
                    <div key={i} className="rounded-md border border-line bg-bg-elev p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={a.kind}
                          onChange={(e) => updateAction(i, { kind: e.target.value, params: {} })}
                          className="rounded-md border border-line bg-bg p-1 text-[12px]"
                        >
                          {ACTION_OPTIONS.map((o) => (<option key={o.kind} value={o.kind}>{o.label}</option>))}
                        </select>
                        <button
                          type="button"
                          className="ml-auto btn"
                          onClick={() => setActions((p) => p.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 size={11} className="text-red-500" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="mt-2 grid gap-1.5">
                        {(opt?.fields || []).map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <label className="text-[11px] muted w-32 flex-none">{f}</label>
                            <input
                              value={a.params[f] ?? ''}
                              onChange={(e) => updateActionParam(i, f, e.target.value)}
                              className="flex-1 rounded-md border border-line bg-bg p-1 text-[12px] outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Regla activa
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !name.trim() || actions.length === 0}>
              {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Save size={12} aria-hidden="true" />}
              Guardar
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
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[8px_10px] text-[13px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
