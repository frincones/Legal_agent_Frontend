'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';

type Hook = {
  id: string;
  hook_key: string;
  name: string;
  description: string | null;
  hook_type: string;
  python_module: string;
  applies_to: string[];
  enabled: boolean;
  order_index: number;
  decision_mode: 'block' | 'warn' | 'log';
};

const DECISION_ICONS = {
  block: { Icon: AlertCircle, color: 'text-danger' },
  warn: { Icon: AlertCircle, color: 'text-warn' },
  log: { Icon: Info, color: 'text-ink-3' },
};

export default function SaasHooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/saas/hooks', { cache: 'no-store' });
      if (r.ok) setHooks(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function toggle(h: Hook) {
    const r = await fetch(`/api/saas/hooks/${h.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !h.enabled }),
    });
    if (r.ok) {
      toast.success(`Hook ${!h.enabled ? 'habilitado' : 'deshabilitado'}`);
      void refresh();
    }
  }

  async function changeMode(h: Hook, mode: string) {
    const r = await fetch(`/api/saas/hooks/${h.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision_mode: mode }),
    });
    if (r.ok) { toast.success('Mode actualizado'); void refresh(); }
  }

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Hooks</span></>}
          title="Hooks legales · linters + validators"
          subtitle="Habilita/deshabilita validadores que se ejecutan pre/post skill. Block bloquea · Warn advierte · Log solo registra."
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {loading ? (
            <div className="surface p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando…</div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-bg-2">
                  <tr>
                    <th className="text-left p-2">Hook</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Decision mode</th>
                    <th className="text-left p-2">Aplica a</th>
                    <th className="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {hooks.map(h => {
                    const meta = DECISION_ICONS[h.decision_mode];
                    return (
                      <tr key={h.id} className="border-t hover:bg-bg-2">
                        <td className="p-2">
                          <div className="font-medium">{h.name}</div>
                          <div className="text-[11px] muted mono">{h.hook_key}</div>
                          {h.description && (
                            <div className="text-[11px] muted">{h.description}</div>
                          )}
                        </td>
                        <td className="p-2"><span className="chip text-[10px]">{h.hook_type}</span></td>
                        <td className="p-2">
                          <select
                            value={h.decision_mode}
                            onChange={e => changeMode(h, e.target.value)}
                            className="input text-[11.5px]"
                          >
                            <option value="block">Block</option>
                            <option value="warn">Warn</option>
                            <option value="log">Log</option>
                          </select>
                        </td>
                        <td className="p-2 text-[11px]">
                          {h.applies_to.length === 0 ? (
                            <span className="muted">Todas las skills</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {h.applies_to.map(c => (
                                <code key={c} className="mono text-[10px] chip">{c}</code>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => toggle(h)}
                            className={`btn btn-sm ${h.enabled ? 'btn-primary' : ''}`}
                          >
                            {h.enabled ? 'Habilitado' : 'Deshabilitado'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
