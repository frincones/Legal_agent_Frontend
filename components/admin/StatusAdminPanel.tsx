'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CLS: Record<string, string> = {
  operational: 'chip-ok', degraded: 'chip-warn',
  partial_outage: 'chip-warn', major_outage: 'chip-bad',
  maintenance: 'chip-accent',
};

export function StatusAdminPanel() {
  const [summary, setSummary] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', impact: 'minor', components: [] as string[] });

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/public/status', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch('/api/admin/status/incidents', { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
    ]).then(([s, i]) => {
      setSummary(s); setIncidents(i?.items || []);
    }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function probeNow() {
    setProbing(true);
    try {
      const r = await fetch('/api/admin/status/probe-now', { method: 'POST' });
      if (r.ok) { toast.success('Probes ejecutados'); load(); }
      else toast.error('No se pudo correr probes');
    } finally { setProbing(false); }
  }

  async function createIncident() {
    if (!form.title) return;
    const r = await fetch('/api/admin/status/incidents', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) { toast.success('Incident creado'); setShowForm(false); setForm({ title: '', body: '', impact: 'minor', components: [] }); load(); }
    else toast.error('No se pudo crear');
  }

  async function updateIncident(id: string) {
    const message = prompt('Mensaje de update:');
    if (!message) return;
    const status = prompt('Status nuevo (investigating/identified/monitoring/resolved):', 'investigating');
    if (!status || !['investigating', 'identified', 'monitoring', 'resolved'].includes(status)) return;
    const r = await fetch(`/api/admin/status/incidents/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, message }),
    });
    if (r.ok) { toast.success('Update enviado'); load(); }
  }

  if (loading) return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Components */}
      <section className="surface p-4">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="serif text-[15px] font-semibold">Componentes</h3>
          <button className="btn btn-sm" onClick={probeNow} disabled={probing}>
            {probing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Probe ahora
          </button>
        </header>
        <ul className="grid gap-2">
          {(summary?.components || []).map((c: any) => (
            <li key={c.key} className="flex items-center gap-3 border-b border-line/30 py-2 last:border-0">
              <span className={cn('chip text-[10px]', STATUS_CLS[c.status] || 'chip-neutral')}>
                {c.status}
              </span>
              <div className="flex-1">
                <div className="font-medium text-[13px]">{c.name}</div>
                <div className="text-[10.5px] muted">{c.description}</div>
              </div>
              <div className="text-right text-[11px]">
                <div className="font-mono">{Math.round(c.uptime_30d_pct * 100) / 100}%</div>
                <div className="muted text-[10px]">uptime 30d</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Incidents */}
      <section className="surface p-4">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="serif text-[15px] font-semibold">Incidentes</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={12} /> Crear incident
          </button>
        </header>

        {showForm && (
          <div className="grid gap-2 mb-4 rounded-md border border-line p-3">
            <input className="input" placeholder="Título" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input min-h-16" placeholder="Descripción inicial" value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })} />
            <select className="input" value={form.impact}
              onChange={(e) => setForm({ ...form, impact: e.target.value })}>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={createIncident}>Crear</button>
          </div>
        )}

        {incidents.length === 0 ? (
          <div className="text-center text-[12.5px] muted py-4">Sin incidents.</div>
        ) : (
          <ul className="grid gap-2">
            {incidents.map((i) => (
              <li key={i.id} className="rounded-md border border-line p-3">
                <header className="flex items-center justify-between mb-1">
                  <strong className="text-[13px]">{i.title}</strong>
                  <div className="flex gap-1 items-center">
                    <span className={cn('chip text-[10px]',
                      i.status === 'resolved' ? 'chip-ok' : 'chip-warn')}>{i.status}</span>
                    <span className="chip chip-neutral text-[10px]">{i.impact}</span>
                  </div>
                </header>
                {i.body && <p className="text-[11.5px] muted">{i.body}</p>}
                <footer className="mt-2 flex justify-between items-center text-[10.5px] muted">
                  <span>Inicio: {new Date(i.started_at).toLocaleString('es-CO')}</span>
                  {i.status !== 'resolved' && (
                    <button className="text-accent hover:underline" onClick={() => updateIncident(i.id)}>
                      Agregar update →
                    </button>
                  )}
                </footer>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
