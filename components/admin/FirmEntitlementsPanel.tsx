'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Module = {
  key: string; name: string; category: string;
  is_core: boolean; ui_route: string | null;
  enabled: boolean; has_override: boolean;
};

type QuotaState = {
  quota_key: string; name: string; unit: string;
  limit: number | null; used: number; remaining: number | null;
  has_override: boolean;
};

const CATEGORY_CLS: Record<string, string> = {
  core: 'chip-ok', productivity: 'chip-accent', ai: 'chip-purple',
  docs: 'chip-neutral', calc: 'chip-neutral',
  collaboration: 'chip-accent', automation: 'chip-warn',
  analytics: 'chip-purple', integrations: 'chip-neutral',
  client_facing: 'chip-accent', billing: 'chip-warn',
  marketplace: 'chip-accent', admin_only: 'chip-bad',
};

export function FirmEntitlementsPanel({ firmId }: { firmId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/firms/${firmId}/entitlements`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [firmId]);

  async function setModuleOverride(moduleKey: string, currentEnabled: boolean) {
    const newEnabled = !currentEnabled;
    const reason = prompt(`Razón para ${newEnabled ? 'activar' : 'desactivar'} ${moduleKey}:`);
    if (!reason || reason.length < 5) {
      toast.error('Razón obligatoria (mín 5 caracteres)');
      return;
    }
    const expires = prompt('Días hasta expirar (vacío = no expira):');
    let expires_at: string | null = null;
    if (expires && !isNaN(Number(expires))) {
      const d = new Date();
      d.setDate(d.getDate() + Number(expires));
      expires_at = d.toISOString();
    }
    const r = await fetch(`/api/admin/firms/${firmId}/module-overrides`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ module_key: moduleKey, enabled: newEnabled, reason, expires_at }),
    });
    if (r.ok) { toast.success(`Override aplicado · ${moduleKey} ${newEnabled ? 'ON' : 'OFF'}`); load(); }
    else toast.error('No se pudo aplicar');
  }

  async function removeModuleOverride(moduleKey: string) {
    if (!confirm(`¿Eliminar override de ${moduleKey}?`)) return;
    const r = await fetch(`/api/admin/firms/${firmId}/module-overrides/${moduleKey}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Override eliminado'); load(); }
    else toast.error('No se pudo eliminar');
  }

  async function setQuotaOverride(quotaKey: string) {
    const value = prompt(`Nuevo límite para ${quotaKey} (vacío = ilimitado):`);
    if (value === null) return;
    const limit_value = value === '' ? null : Number(value);
    if (value !== '' && isNaN(limit_value as number)) {
      toast.error('Valor inválido');
      return;
    }
    const reason = prompt('Razón:');
    if (!reason || reason.length < 5) {
      toast.error('Razón obligatoria (mín 5 caracteres)');
      return;
    }
    const expires = prompt('Días hasta expirar (vacío = no expira):');
    let expires_at: string | null = null;
    if (expires && !isNaN(Number(expires))) {
      const d = new Date();
      d.setDate(d.getDate() + Number(expires));
      expires_at = d.toISOString();
    }
    const r = await fetch(`/api/admin/firms/${firmId}/quota-overrides`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quota_type_key: quotaKey, limit_value, reason, expires_at }),
    });
    if (r.ok) { toast.success(`Cuota override aplicada · ${quotaKey} = ${limit_value ?? '∞'}`); load(); }
    else toast.error('No se pudo aplicar');
  }

  if (loading) return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  if (!data) return <div className="surface p-6 text-center text-[13px] muted">No se pudo cargar.</div>;

  const ent = data.entitlements || {};
  const modulesMap = ent.modules || {};
  const quotasMap = ent.quotas || {};
  const modulesList: Module[] = Object.entries(modulesMap).map(([key, v]: [string, any]) => ({
    key, ...v,
  }));
  const quotasList: QuotaState[] = Object.values(quotasMap);
  const moduleOverrides = data.module_overrides || [];
  const quotaOverrides = data.quota_overrides || [];

  const grouped = modulesList.reduce((acc, m) => {
    (acc[m.category] = acc[m.category] || []).push(m);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <section className="surface p-4">
        <h3 className="serif text-[15px] font-semibold mb-2">Plan vigente</h3>
        <div className="text-[12.5px]">
          <span className="chip chip-purple text-[10px]">{ent.plan?.code}</span>
          {' · '}
          <span>{ent.plan?.name}</span>
          {' · '}
          <span className="muted">status: {ent.plan?.status}</span>
        </div>
      </section>

      {/* Overrides activos */}
      {(moduleOverrides.length > 0 || quotaOverrides.length > 0) && (
        <section className="surface border-warn/40 bg-warn-soft p-4">
          <h3 className="serif text-[15px] font-semibold mb-2">Overrides activos</h3>
          <ul className="grid gap-1 text-[11.5px]">
            {moduleOverrides.map((o: any) => (
              <li key={o.module_key} className="flex items-center gap-2">
                <span className={cn('chip text-[10px]', o.enabled ? 'chip-ok' : 'chip-bad')}>
                  {o.enabled ? 'ON' : 'OFF'}
                </span>
                <strong>{o.module_name}</strong>
                <span className="muted">({o.module_key})</span>
                {o.reason && <span className="muted">· {o.reason}</span>}
                {o.expires_at && (
                  <span className="muted">· expira {new Date(o.expires_at).toLocaleDateString('es-CO')}</span>
                )}
                <button className="ml-auto text-bad hover:underline" onClick={() => removeModuleOverride(o.module_key)}>
                  <Trash2 size={11} />
                </button>
              </li>
            ))}
            {quotaOverrides.map((o: any) => (
              <li key={o.quota_type_key} className="flex items-center gap-2">
                <span className="chip chip-accent text-[10px]">
                  {o.limit_value === null ? '∞' : o.limit_value} {o.unit}
                </span>
                <strong>{o.quota_name}</strong>
                {o.reason && <span className="muted">· {o.reason}</span>}
                {o.expires_at && (
                  <span className="muted">· expira {new Date(o.expires_at).toLocaleDateString('es-CO')}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tabs */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quotas */}
        <section className="surface p-4">
          <h3 className="serif text-[15px] font-semibold mb-3">Cuotas resueltas</h3>
          <ul className="grid gap-2 text-[11.5px]">
            {quotasList.map((q) => (
              <li key={q.quota_key} className="flex items-center gap-2 border-b border-line/30 py-1.5 last:border-0">
                <span className="flex-1">
                  <div className="font-medium">{q.name}</div>
                  <div className="text-[10px] muted">{q.quota_key}</div>
                </span>
                <span className="font-mono text-[11px]">
                  {q.used} / {q.limit ?? '∞'} {q.unit}
                </span>
                {q.has_override && <span className="chip chip-warn text-[9px]">override</span>}
                <button className="btn btn-ghost btn-sm" onClick={() => setQuotaOverride(q.quota_key)}>
                  Override
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Modules · grouped */}
        <section className="surface p-4">
          <h3 className="serif text-[15px] font-semibold mb-3">Módulos resueltos</h3>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-3">
              <div className="mb-1">
                <span className={cn('chip text-[9px]', CATEGORY_CLS[cat] || 'chip-neutral')}>{cat}</span>
              </div>
              <ul className="grid gap-0.5 text-[11px]">
                {items.map((m) => (
                  <li key={m.key} className="flex items-center gap-2">
                    <span className={cn('chip text-[9px]', m.enabled ? 'chip-ok' : 'chip-neutral')}>
                      {m.enabled ? 'ON' : 'OFF'}
                    </span>
                    <span className="flex-1">
                      {m.name}
                      {m.has_override && <span className="ml-1 chip chip-warn text-[8px]">override</span>}
                    </span>
                    {!m.is_core && (
                      <button
                        className="text-[10px] text-accent hover:underline"
                        onClick={() => setModuleOverride(m.key, m.enabled)}
                      >
                        {m.has_override ? 'cambiar' : 'override'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
