'use client';

/**
 * Sprint M21.S3.C · MattersListClient
 *
 * Lista de matters v2 con form para crear nuevo. Operaciones contra /v2/matters.
 */

import { useEffect, useState } from 'react';
import { listMattersV2, createMatterV2, type MatterV2 } from '@/lib/api/v2/matters';

const AREAS = [
  'notarial', 'judicial_civil', 'judicial_laboral', 'judicial_admin',
  'contractual', 'corporate', 'penal', 'constitucional', 'petitorio',
];
const SIDES = ['demandante', 'demandado', 'comprador', 'vendedor', 'arrendador', 'arrendatario', 'neutral'];

export default function MattersListClient() {
  const [items, setItems] = useState<MatterV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    title: '', area: 'notarial', side: '', opposing_party: '', client_name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listMattersV2({ active_only: true, limit: 100 });
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, []);

  const submitCreate = async () => {
    if (!draft.title.trim() || !draft.area) return;
    setSubmitting(true);
    setError(null);
    try {
      await createMatterV2({
        title: draft.title.trim(),
        area: draft.area,
        side: draft.side || undefined,
        opposing_party: draft.opposing_party || undefined,
        client_name: draft.client_name || undefined,
      });
      setShowCreate(false);
      setDraft({ title: '', area: 'notarial', side: '', opposing_party: '', client_name: '' });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Mis casos</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded bg-zinc-900 text-white text-sm px-4 py-2 hover:bg-zinc-800"
        >
          {showCreate ? 'Cancelar' : '+ Nuevo caso'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => { e.preventDefault(); void submitCreate(); }}
          className="rounded-lg border border-zinc-200 bg-white p-5 space-y-3"
        >
          <div>
            <label className="text-xs font-medium text-zinc-700 mb-1 block">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Demanda Moreno vs Transportes SAS"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">
                Área <span className="text-red-500">*</span>
              </label>
              <select
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
              >
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Posición</label>
              <select
                value={draft.side}
                onChange={(e) => setDraft({ ...draft, side: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
              >
                <option value="">—</option>
                {SIDES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Cliente</label>
              <input
                value={draft.client_name}
                onChange={(e) => setDraft({ ...draft, client_name: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Contraparte</label>
              <input
                value={draft.opposing_party}
                onChange={(e) => setDraft({ ...draft, opposing_party: e.target.value })}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
          {error && <div className="rounded bg-red-50 text-red-700 text-xs p-3">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !draft.title}
              className="rounded bg-zinc-900 text-white text-sm px-4 py-2 hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? 'Creando…' : 'Crear caso'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-zinc-500 py-12 text-center">Cargando casos…</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm text-zinc-600 mb-3">Aún no tienes casos activos en LexAI v2.</p>
          <p className="text-xs text-zinc-500">
            Crea uno arriba o pide en el composer: <em>&ldquo;nuevo caso de fueros sindicales contra Transportes SAS&rdquo;</em>.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.matter_id} className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors">
              <div className="flex items-baseline justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900 truncate">{m.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {m.area}{m.side ? ` · ${m.side}` : ''}{m.client_name ? ` · ${m.client_name}` : ''}
                    {m.opposing_party ? ` vs ${m.opposing_party}` : ''}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wide rounded bg-zinc-100 text-zinc-600 px-1.5 py-0.5">
                  {m.phase ?? 'activo'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
