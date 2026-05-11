'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  FileText, Loader2, Plus, Star, Trash2, Upload, User as UserIcon, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRelative } from '@/lib/utils';

type TemplateRow = {
  id: string;
  name: string;
  doc_type: string;
  jurisdiction: string;
  target_court: string | null;
  is_default_for_type: boolean;
  owner_id: string | null;
  is_personal: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
};

const DOC_TYPE_LABEL: Record<string, string> = {
  tutela: 'Acción de tutela',
  contestacion: 'Contestación de demanda',
  demanda_laboral: 'Demanda laboral',
  demanda_civil: 'Demanda civil',
  derecho_peticion: 'Derecho de petición',
  recurso_apelacion: 'Recurso de apelación',
  casacion: 'Recurso de casación',
  recurso_reposicion: 'Recurso de reposición',
  dictamen: 'Dictamen / opinión',
  memorial: 'Memorial',
  contrato: 'Contrato',
  otro: 'Otro',
};

const COURT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: '', label: 'Sin juzgado específico' },
  { id: 'juzgado_civil_circuito', label: 'Juzgado Civil del Circuito' },
  { id: 'juzgado_civil_municipal', label: 'Juzgado Civil Municipal' },
  { id: 'juzgado_laboral_circuito', label: 'Juzgado Laboral del Circuito' },
  { id: 'juzgado_administrativo', label: 'Juzgado Administrativo' },
  { id: 'juzgado_familia', label: 'Juzgado de Familia' },
  { id: 'tribunal_superior', label: 'Tribunal Superior' },
  { id: 'corte_constitucional', label: 'Corte Constitucional' },
  { id: 'corte_suprema', label: 'Corte Suprema de Justicia' },
  { id: 'consejo_estado', label: 'Consejo de Estado' },
];

export function TemplatesManager({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<TemplateRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user-templates', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setItems((await res.json()) as TemplateRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las plantillas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = useCallback(
    async (t: TemplateRow) => {
      if (!window.confirm(`¿Eliminar la plantilla "${t.name}"?`)) return;
      try {
        const res = await fetch(`/api/user-templates/${encodeURIComponent(t.id)}`, {
          method: 'DELETE',
        });
        if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
        toast.success('Plantilla eliminada');
        void load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error eliminando');
      }
    },
    [load],
  );

  return (
    <div className="space-y-5">
      <section className="surface flex items-center gap-3 p-[var(--pad-card)]">
        <FileText size={16} className="text-ink-3" aria-hidden="true" />
        <div>
          <h3 className="serif text-[15px] font-semibold">Plantillas del despacho</h3>
          <p className="text-[12.5px] muted">
            Usa <code className="mono">{'{{variable}}'}</code> para campos editables
            (ej. <code className="mono">{'{{cliente_nombre}}'}</code>).
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary ml-auto"
          onClick={() => setUploadOpen(true)}
        >
          <Plus size={14} aria-hidden="true" />
          Subir plantilla
        </button>
      </section>

      {loading && !items ? (
        <div className="surface flex items-center gap-2 p-6 muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Cargando…
        </div>
      ) : !items || items.length === 0 ? (
        <div className="surface p-6 text-center muted">
          Aún no hay plantillas. Sube tu primer formato Word arriba.
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Juzgado destino</th>
                <th className="px-3 py-2 text-left">Variables</th>
                <th className="px-3 py-2 text-left">Alcance</th>
                <th className="px-3 py-2 text-left">Actualizada</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-line align-top">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-medium text-ink">
                      {t.is_default_for_type && (
                        <Star size={12} className="text-amber-500" aria-label="Default" />
                      )}
                      {t.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 muted">{DOC_TYPE_LABEL[t.doc_type] ?? t.doc_type}</td>
                  <td className="px-3 py-3 muted">
                    {COURT_OPTIONS.find((c) => c.id === (t.target_court ?? ''))?.label ?? t.target_court ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-[11.5px]">
                    {t.variables.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <span className="mono">{t.variables.length} var.</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {t.is_personal ? (
                      <span className="chip">
                        <UserIcon size={10} className="mr-1 inline align-text-top" aria-hidden="true" />
                        Personal
                      </span>
                    ) : (
                      <span className="chip chip-blue">
                        <Users size={10} className="mr-1 inline align-text-top" aria-hidden="true" />
                        Firma
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 muted">{formatRelative(t.updated_at)}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleDelete(t)}
                      aria-label="Eliminar"
                      title="Eliminar plantilla"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={load} />
    </div>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUploaded: () => void;
}) {
  const [name, setName] = useState('');
  const [docType, setDocType] = useState<string>('tutela');
  const [targetCourt, setTargetCourt] = useState<string>('');
  const [isPersonal, setIsPersonal] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setName('');
    setDocType('tutela');
    setTargetCourt('');
    setIsPersonal(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const file = fileRef.current?.files?.[0];
      if (!file) {
        toast.warning('Selecciona un archivo .docx, .doc, .md o .txt.');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error('El archivo excede 8 MB.');
        return;
      }
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', name.trim() || file.name.replace(/\.[^.]+$/, ''));
        fd.append('doc_type', docType);
        fd.append('target_court', targetCourt);
        fd.append('is_personal', String(isPersonal));
        fd.append('is_default_for_type', 'false');
        const res = await fetch('/api/user-templates/upload', {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.slice(0, 240) || `Error ${res.status}`);
        }
        toast.success('Plantilla subida');
        reset();
        onOpenChange(false);
        onUploaded();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error subiendo plantilla');
      } finally {
        setBusy(false);
      }
    },
    [name, docType, targetCourt, isPersonal, onOpenChange, onUploaded],
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (busy ? null : onOpenChange(o))}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
          <Dialog.Title className="serif text-[18px] font-semibold">
            Subir plantilla
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            Acepta .docx, .doc, .md o .txt (máx 8 MB). Convierte a markdown
            automáticamente con Docling. Detecta variables{' '}
            <code className="mono">{'{{nombre}}'}</code>.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Archivo</span>
              <input
                ref={fileRef}
                type="file"
                required
                accept=".docx,.doc,.md,.txt"
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[12.5px] outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">
                Nombre interno (opcional · default: nombre del archivo)
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tutela laboral · Comcel"
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11.5px] font-medium muted">Tipo de escrito</span>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                >
                  {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11.5px] font-medium muted">Juzgado destino</span>
                <select
                  value={targetCourt}
                  onChange={(e) => setTargetCourt(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                >
                  {COURT_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={isPersonal}
                onChange={(e) => setIsPersonal(e.target.checked)}
              />
              Plantilla personal (solo yo) · si está desactivado, todo el despacho la verá.
            </label>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary ml-auto" disabled={busy}>
                {busy ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Upload size={14} aria-hidden="true" />
                )}
                {busy ? 'Procesando…' : 'Subir'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
