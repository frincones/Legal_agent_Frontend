'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, Loader2, Play, Plus, Power, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { RuleEditor } from './RuleEditor';
import { cn, formatRelative } from '@/lib/utils';

type Rule = {
  id: string;
  name: string;
  description: string | null;
  trigger_kind: string;
  trigger_config: any;
  conditions: any[];
  actions: any[];
  active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  created_at: string;
};

const TRIGGER_LABEL: Record<string, string> = {
  matter_created: 'Caso creado',
  matter_stage_changed: 'Caso cambia etapa',
  deadline_due_in: 'Plazo próximo',
  client_created: 'Cliente nuevo',
  invoice_overdue: 'Factura vencida',
  lead_stage_changed: 'Lead cambia etapa',
  schedule_daily: 'Diario',
  schedule_weekly: 'Semanal',
};

export function RulesList() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/automation/rules', { cache: 'no-store' });
      if (r.ok) setRules((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function toggleActive(rule: Rule) {
    const r = await fetch(`/api/automation/rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !rule.active }),
    });
    if (r.ok) { toast.success(rule.active ? 'Pausada' : 'Activada'); void refresh(); }
  }

  async function runNow(rule: Rule) {
    const r = await fetch(`/api/automation/rules/${rule.id}/run-now`, { method: 'POST' });
    if (!r.ok) { toast.error('Error'); return; }
    const d = await r.json();
    toast.success(`Run: ${d.status}`);
    void refresh();
  }

  async function del(rule: Rule) {
    if (!confirm(`¿Eliminar regla "${rule.name}"?`)) return;
    const r = await fetch(`/api/automation/rules/${rule.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminada'); void refresh(); }
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="serif text-[16px] font-semibold">Automatizaciones</h2>
          <p className="text-[12px] muted">Reglas que ejecutan acciones cuando ocurre algo en tu firma.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={14} aria-hidden="true" /> Nueva regla
        </button>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : rules.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Aún no tienes reglas configuradas. Crea una para automatizar tareas repetitivas.
        </div>
      ) : (
        <div className="surface overflow-x-auto p-2">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                <th className="py-2">Nombre</th>
                <th className="py-2">Trigger</th>
                <th className="py-2 text-right">Acciones</th>
                <th className="py-2 text-right">Runs</th>
                <th className="py-2">Último</th>
                <th className="py-2">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t border-line text-[12.5px]">
                  <td className="py-2">
                    <button onClick={() => setEditing(r)} className="font-semibold hover:underline">{r.name}</button>
                    {r.description && <div className="text-[11px] muted">{r.description}</div>}
                  </td>
                  <td className="py-2 muted">{TRIGGER_LABEL[r.trigger_kind] || r.trigger_kind}</td>
                  <td className="py-2 text-right mono">{(r.actions || []).length}</td>
                  <td className="py-2 text-right mono">{r.run_count}</td>
                  <td className="py-2 muted">
                    {r.last_run_at ? formatRelative(r.last_run_at) : '—'}
                    {r.last_run_status && (
                      <span className={cn(
                        'ml-1 inline-flex items-center gap-0.5 text-[10.5px]',
                        r.last_run_status === 'success' ? 'text-emerald-500' :
                        r.last_run_status === 'failed' ? 'text-red-500' :
                        r.last_run_status === 'skipped' ? 'text-ink-3' : 'text-amber-500',
                      )}>
                        {r.last_run_status === 'success' ? <CheckCircle2 size={10} aria-hidden="true" /> :
                         r.last_run_status === 'failed' ? <XCircle size={10} aria-hidden="true" /> : null}
                        {r.last_run_status}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    <button onClick={() => toggleActive(r)} title={r.active ? 'Pausar' : 'Activar'}>
                      <Power size={14} className={r.active ? 'text-emerald-500' : 'text-ink-3'} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="py-2 text-right">
                    <div className="inline-flex gap-1">
                      <button className="btn" onClick={() => runNow(r)} title="Ejecutar ahora">
                        <Play size={12} aria-hidden="true" />
                      </button>
                      <button className="btn" onClick={() => del(r)} title="Eliminar">
                        <Trash2 size={12} className="text-red-500" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <RuleEditor
          rule={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); void refresh(); }}
        />
      )}
    </div>
  );
}
