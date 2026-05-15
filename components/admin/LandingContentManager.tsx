'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Tab = 'changelog' | 'testimonials';

export function LandingContentManager() {
  const [tab, setTab] = useState<Tab>('changelog');

  return (
    <div className="flex flex-col gap-3">
      <nav className="surface flex gap-1 p-1">
        {(['changelog', 'testimonials'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('rounded-md px-3 py-1.5 text-[12.5px] font-medium transition',
              tab === t ? 'bg-accent text-on-accent' : 'text-ink-2 hover:bg-bg-sunken')}
          >
            {t === 'changelog' ? 'Changelog' : 'Testimonios'}
          </button>
        ))}
      </nav>

      {tab === 'changelog' ? <ChangelogPanel /> : <TestimonialsPanel />}
    </div>
  );
}

function ChangelogPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: '', title: '', summary: '', body_md: '', category: 'feature',
    version: '', highlighted: false, published: true,
  });

  function load() {
    setLoading(true);
    fetch('/api/admin/changelog', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const r = await fetch('/api/admin/changelog', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      toast.success('Changelog creado');
      setShowForm(false);
      setForm({ slug: '', title: '', summary: '', body_md: '', category: 'feature',
                version: '', highlighted: false, published: true });
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      toast.error(d.detail || 'No se pudo crear');
    }
  }

  async function toggle(slug: string, field: 'published' | 'highlighted', current: boolean) {
    const r = await fetch(`/api/admin/changelog/${slug}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    if (r.ok) load();
  }

  async function del(slug: string) {
    if (!confirm(`¿Eliminar entrada "${slug}"?`)) return;
    const r = await fetch(`/api/admin/changelog/${slug}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminado'); load(); }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Nueva entrada
        </button>
      </div>

      {showForm && (
        <div className="surface grid gap-2 p-4 md:grid-cols-2">
          <input className="input" placeholder="slug (ej. s27-pricing-publico)" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <select className="input" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="feature">Nuevo feature</option>
            <option value="improvement">Mejora</option>
            <option value="fix">Fix</option>
            <option value="breaking">Breaking change</option>
            <option value="announcement">Anuncio</option>
          </select>
          <input className="input md:col-span-2" placeholder="Título" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input md:col-span-2" placeholder="Resumen (1-2 líneas)" value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          <textarea className="input md:col-span-2 min-h-24" placeholder="Cuerpo (Markdown)" value={form.body_md}
            onChange={(e) => setForm({ ...form, body_md: e.target.value })} />
          <input className="input" placeholder="Versión (ej. v2.7.0)" value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <div className="flex gap-3 text-[12px]">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={form.highlighted}
                onChange={(e) => setForm({ ...form, highlighted: e.target.checked })} />
              Destacado
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Publicado
            </label>
          </div>
          <button className="btn btn-primary md:col-span-2" onClick={create}>Crear</button>
        </div>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Título</th>
                <th className="px-3 py-2 text-left">Cat.</th>
                <th className="px-3 py-2 text-left">Versión</th>
                <th className="px-3 py-2 text-left">Pub.</th>
                <th className="px-3 py-2 text-left">Dest.</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-line/40">
                  <td className="px-3 py-2">
                    <div className="font-medium">{c.title}</div>
                    <div className="font-mono text-[10px] muted">{c.slug}</div>
                  </td>
                  <td className="px-3 py-2"><span className="chip chip-neutral text-[10px]">{c.category}</span></td>
                  <td className="px-3 py-2 font-mono text-[11px]">{c.version || '—'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggle(c.slug, 'published', c.published)}
                      className={cn('chip cursor-pointer text-[10px]', c.published ? 'chip-ok' : 'chip-neutral')}>
                      {c.published ? 'sí' : 'no'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggle(c.slug, 'highlighted', c.highlighted)}
                      className={cn('chip cursor-pointer text-[10px]', c.highlighted ? 'chip-warn' : 'chip-neutral')}>
                      {c.highlighted ? '★' : '·'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-bad hover:underline" onClick={() => del(c.slug)}><Trash2 size={11} /></button>
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

function TestimonialsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: '', author_name: '', author_role: '', firm_name: '', quote: '',
    rating: 5, area_practica: '', country: 'CO', featured: false, published: true, sort_order: 100,
  });

  function load() {
    setLoading(true);
    fetch('/api/admin/testimonials', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const r = await fetch('/api/admin/testimonials', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      toast.success('Testimonio creado');
      setShowForm(false);
      load();
    } else toast.error('No se pudo crear');
  }

  async function toggle(slug: string, field: 'published' | 'featured', current: boolean) {
    const r = await fetch(`/api/admin/testimonials/${slug}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [field]: !current }),
    });
    if (r.ok) load();
  }

  async function del(slug: string) {
    if (!confirm('¿Eliminar?')) return;
    const r = await fetch(`/api/admin/testimonials/${slug}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminado'); load(); }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Nuevo testimonio
        </button>
      </div>

      {showForm && (
        <div className="surface grid gap-2 p-4 md:grid-cols-2">
          <input className="input" placeholder="slug" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="input" placeholder="Nombre autor" value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
          <input className="input" placeholder="Rol/cargo" value={form.author_role}
            onChange={(e) => setForm({ ...form, author_role: e.target.value })} />
          <input className="input" placeholder="Firma" value={form.firm_name}
            onChange={(e) => setForm({ ...form, firm_name: e.target.value })} />
          <textarea className="input md:col-span-2 min-h-20" placeholder="Quote" value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })} />
          <input className="input" placeholder="Área (laboral, civil, etc.)" value={form.area_practica}
            onChange={(e) => setForm({ ...form, area_practica: e.target.value })} />
          <select className="input" value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}>
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="HN">Honduras</option>
            <option value="GT">Guatemala</option>
          </select>
          <div className="flex gap-3 text-[12px] md:col-span-2">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Destacado (landing)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Publicado
            </label>
          </div>
          <button className="btn btn-primary md:col-span-2" onClick={create}>Crear</button>
        </div>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Autor</th>
                <th className="px-3 py-2 text-left">Quote</th>
                <th className="px-3 py-2 text-left">Área</th>
                <th className="px-3 py-2 text-left">País</th>
                <th className="px-3 py-2 text-left">Pub.</th>
                <th className="px-3 py-2 text-left">Dest.</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-line/40">
                  <td className="px-3 py-2">
                    <div className="font-medium">{t.author_name}</div>
                    <div className="text-[10.5px] muted">{t.author_role || ''}</div>
                  </td>
                  <td className="px-3 py-2 max-w-xs"><div className="line-clamp-2 italic">"{t.quote}"</div></td>
                  <td className="px-3 py-2 text-[11px] muted">{t.area_practica || '—'}</td>
                  <td className="px-3 py-2"><span className="chip chip-neutral text-[10px]">{t.country}</span></td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggle(t.slug, 'published', t.published)}
                      className={cn('chip cursor-pointer text-[10px]', t.published ? 'chip-ok' : 'chip-neutral')}>
                      {t.published ? 'sí' : 'no'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggle(t.slug, 'featured', t.featured)}
                      className={cn('chip cursor-pointer text-[10px]', t.featured ? 'chip-warn' : 'chip-neutral')}>
                      {t.featured ? '★' : '·'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-bad hover:underline" onClick={() => del(t.slug)}><Trash2 size={11} /></button>
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
