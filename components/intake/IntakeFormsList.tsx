'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Edit2, ExternalLink, Loader2, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';
import { IntakeFormBuilder, type IntakeField } from './IntakeFormBuilder';

type Form = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  fields: IntakeField[];
  thank_you_message: string | null;
  redirect_url: string | null;
  default_assignee_user_id: string | null;
  default_materia: string | null;
  brand_color: string | null;
  show_firm_logo: boolean;
  active: boolean;
  submissions_count: number;
  created_at: string | null;
  updated_at: string | null;
};

type FirmUser = { id: string; full_name: string };

export function IntakeFormsList({ onSelectForm }: { onSelectForm?: (formId: string) => void }) {
  const [items, setItems] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<FirmUser[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Form>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/intake-forms', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void (async () => {
      try {
        const r = await fetch('/api/firm-users', { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          setUsers((data.items || data.users || []).map((u: any) => ({
            id: u.id, full_name: u.full_name || u.fullName || '',
          })));
        }
      } catch { /* ignore */ }
    })();
  }, [refresh]);

  function openCreate() {
    setDraft({
      name: '',
      fields: [
        { id: 'nombre', label: 'Nombre completo', kind: 'text', required: true },
        { id: 'email', label: 'Email', kind: 'email', required: true },
        { id: 'telefono', label: 'Teléfono', kind: 'phone', required: false },
        { id: 'descripcion', label: 'Cuéntanos tu caso', kind: 'textarea', required: true },
      ],
      thank_you_message: 'Gracias. Te contactaremos pronto.',
      brand_color: 'blue',
      show_firm_logo: true,
    });
    setEditorOpen(true);
  }

  function openEdit(f: Form) {
    setDraft({ ...f });
    setEditorOpen(true);
  }

  async function save() {
    if (!draft.name || !draft.name.trim()) {
      toast.error('Necesitas un nombre');
      return;
    }
    if (!draft.fields || draft.fields.length === 0) {
      toast.error('Necesitas al menos un campo');
      return;
    }
    const isUpdate = !!draft.id;
    const payload = {
      name: draft.name.trim(),
      description: draft.description || null,
      fields: draft.fields,
      thank_you_message: draft.thank_you_message || null,
      redirect_url: draft.redirect_url || null,
      default_assignee_user_id: draft.default_assignee_user_id || null,
      default_materia: draft.default_materia || null,
      brand_color: draft.brand_color || 'blue',
      show_firm_logo: !!draft.show_firm_logo,
    };
    const r = await fetch(isUpdate ? `/api/intake-forms/${draft.id}` : '/api/intake-forms', {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      toast.success(isUpdate ? 'Form actualizado' : 'Form creado');
      setEditorOpen(false);
      setDraft({});
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(typeof data.detail === 'string' ? data.detail : (data.detail?.detail || 'No se pudo guardar'));
    }
  }

  async function toggleActive(f: Form) {
    const r = await fetch(`/api/intake-forms/${f.id}/${f.active ? 'pause' : 'activate'}`, {
      method: 'POST',
    });
    if (r.ok) void refresh();
  }

  async function remove(f: Form) {
    if (!confirm(`¿Eliminar form "${f.name}"? Las submissions también se borran.`)) return;
    const r = await fetch(`/api/intake-forms/${f.id}`, { method: 'DELETE' });
    if (r.ok) {
      toast.success('Form eliminado');
      void refresh();
    }
  }

  function copyPublicUrl(slug: string) {
    const url = `${window.location.origin}/intake/${slug}`;
    void navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="serif m-0 text-[15px] font-semibold">Formularios públicos</h2>
          <p className="text-[11.5px] muted">
            Comparte el link en WhatsApp / email · cada submission crea un lead asignado.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} /> Nuevo formulario
        </button>
      </header>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={20} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-10 text-center">
          <div className="text-[13px] font-medium">Sin formularios todavía</div>
          <p className="mx-auto mt-1 max-w-md text-[12px] muted">
            Crea un formulario público · cuando un cliente lo llene, automáticamente
            se crea un lead asignado al abogado correspondiente.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((f) => (
            <li key={f.id} className="flex items-start gap-3 rounded-md border border-line bg-bg-elev px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <button
                    onClick={() => onSelectForm?.(f.id)}
                    className="text-[13.5px] font-semibold hover:underline"
                  >
                    {f.name}
                  </button>
                  <span className={cn('chip text-[10px]', f.active ? 'chip-green' : 'chip-neutral')}>
                    {f.active ? 'Activo' : 'Pausado'}
                  </span>
                  <span className="text-[10.5px] muted">
                    /intake/{f.slug}
                  </span>
                  <button
                    onClick={() => copyPublicUrl(f.slug)}
                    className="btn btn-icon btn-ghost btn-sm"
                    title="Copiar URL pública"
                  >
                    <Copy size={11} />
                  </button>
                  <a
                    href={`/intake/${f.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-icon btn-ghost btn-sm"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
                {f.description && <p className="line-clamp-1 text-[11.5px] muted">{f.description}</p>}
                <div className="mt-0.5 text-[10.5px] muted">
                  {f.submissions_count} submissions · actualizado {f.updated_at ? formatRelative(f.updated_at) : '—'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(f)}>
                {f.active ? <Pause size={12} /> : <Play size={12} />}
                {f.active ? 'Pausar' : 'Activar'}
              </button>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(f)} aria-label="Editar">
                <Edit2 size={12} />
              </button>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => remove(f)} aria-label="Eliminar">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg-overlay backdrop-blur-sm overflow-y-auto">
          <div className="my-[6vh] w-[min(96vw,720px)] rounded-xl border border-line bg-bg shadow-2">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif text-[14px] font-semibold">
                {draft.id ? 'Editar formulario' : 'Nuevo formulario'}
              </h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditorOpen(false)} aria-label="Cerrar">
                <X size={14} />
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <label className="grid gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                  Nombre (visible al cliente)
                </span>
                <input
                  className="input"
                  value={draft.name || ''}
                  onChange={(ev) => setDraft((p) => ({ ...p, name: ev.target.value }))}
                  placeholder="Ej: Consulta nueva tutela"
                  autoFocus
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Descripción (opcional)</span>
                <textarea
                  className="input min-h-[60px]"
                  rows={2}
                  value={draft.description || ''}
                  onChange={(ev) => setDraft((p) => ({ ...p, description: ev.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Asignar a (default)</span>
                  <select
                    className="input"
                    value={draft.default_assignee_user_id || ''}
                    onChange={(ev) => setDraft((p) => ({ ...p, default_assignee_user_id: ev.target.value || null }))}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Materia default</span>
                  <input
                    className="input"
                    placeholder="ej: laboral"
                    value={draft.default_materia || ''}
                    onChange={(ev) => setDraft((p) => ({ ...p, default_materia: ev.target.value }))}
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Mensaje de agradecimiento</span>
                <input
                  className="input"
                  value={draft.thank_you_message || ''}
                  onChange={(ev) => setDraft((p) => ({ ...p, thank_you_message: ev.target.value }))}
                />
              </label>

              <div>
                <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                  Campos del formulario
                </div>
                <IntakeFormBuilder
                  fields={draft.fields || []}
                  onChange={(next) => setDraft((p) => ({ ...p, fields: next }))}
                />
              </div>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={save}>
                {draft.id ? 'Guardar cambios' : 'Crear formulario'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
