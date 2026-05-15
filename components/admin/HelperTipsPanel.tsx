'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Tip = {
  id: string; key: string; route_pattern: string | null;
  module_key: string | null; title: string; body: string;
  cta_label: string | null; cta_href: string | null;
  priority: number; active: boolean; category: string;
};

const CATEGORY_CLS: Record<string, string> = {
  tip: 'chip-neutral', feature: 'chip-purple', warning: 'chip-warn',
  onboarding: 'chip-ok', keyboard_shortcut: 'chip-accent',
};

export function HelperTipsPanel() {
  const [items, setItems] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    key: '', title: '', body: '', route_pattern: '', module_key: '',
    cta_label: '', cta_href: '', priority: 100, category: 'tip', active: true,
  });

  function load() {
    setLoading(true);
    fetch('/api/admin/helper-tips', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function createTip() {
    const payload: any = { key: form.key, title: form.title, body: form.body };
    if (form.route_pattern) payload.route_pattern = form.route_pattern;
    if (form.module_key) payload.module_key = form.module_key;
    if (form.cta_label) payload.cta_label = form.cta_label;
    if (form.cta_href) payload.cta_href = form.cta_href;
    payload.priority = form.priority;
    payload.category = form.category;
    payload.active = form.active;
    const r = await fetch('/api/admin/helper-tips', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      toast.success('Tip creado');
      setShowForm(false);
      setForm({ key: '', title: '', body: '', route_pattern: '', module_key: '',
                cta_label: '', cta_href: '', priority: 100, category: 'tip', active: true });
      load();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || 'No se pudo crear');
    }
  }

  async function toggleActive(tip: Tip) {
    const r = await fetch(`/api/admin/helper-tips/${tip.key}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !tip.active }),
    });
    if (r.ok) { toast.success('Actualizado'); load(); }
  }

  async function deleteTip(tip: Tip) {
    if (!confirm(`¿Eliminar tip "${tip.title}"?`)) return;
    const r = await fetch(`/api/admin/helper-tips/${tip.key}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Tip eliminado'); load(); }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Nuevo tip
        </button>
      </div>

      {showForm && (
        <div className="surface grid gap-2 p-4 md:grid-cols-2">
          <input className="input" placeholder="key (ej. casos_canvas_tip)" value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <select className="input" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="tip">tip</option>
            <option value="feature">feature</option>
            <option value="warning">warning</option>
            <option value="onboarding">onboarding</option>
            <option value="keyboard_shortcut">keyboard_shortcut</option>
          </select>
          <input className="input md:col-span-2" placeholder="Título" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="input md:col-span-2 min-h-16" placeholder="Cuerpo del tip" value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <input className="input" placeholder="route_pattern (ej. /casos o /casos/%)" value={form.route_pattern}
            onChange={(e) => setForm({ ...form, route_pattern: e.target.value })} />
          <input className="input" placeholder="module_key (opcional)" value={form.module_key}
            onChange={(e) => setForm({ ...form, module_key: e.target.value })} />
          <input className="input" placeholder="CTA label (opcional)" value={form.cta_label}
            onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
          <input className="input" placeholder="CTA href (opcional)" value={form.cta_href}
            onChange={(e) => setForm({ ...form, cta_href: e.target.value })} />
          <input className="input" type="number" placeholder="prioridad (0=alta, 1000=baja)" value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <button className="btn btn-primary md:col-span-2" onClick={createTip}>Crear</button>
        </div>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[13px] muted">Sin tips aún. Crea el primero.</div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Tip</th>
                <th className="px-3 py-2 text-left">Ruta / Módulo</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-left">Prio</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-line/40">
                  <td className="px-3 py-2">
                    <div className="font-medium">{t.title}</div>
                    <div className="font-mono text-[10px] muted">{t.key}</div>
                  </td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {t.route_pattern || '*'} {t.module_key && <span>· {t.module_key}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', CATEGORY_CLS[t.category] || 'chip-neutral')}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px]">{t.priority}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(t)}
                      className={cn('chip cursor-pointer text-[10px]', t.active ? 'chip-ok' : 'chip-neutral')}
                    >
                      {t.active ? 'activo' : 'inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-bad hover:underline" onClick={() => deleteTip(t)}>
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
