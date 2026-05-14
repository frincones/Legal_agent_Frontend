'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Flag = {
  key: string; name: string; description: string | null; category: string;
  default_value: boolean; rollout_pct: number; override_count: number;
};

const CATEGORY_CLS: Record<string, string> = {
  general: 'chip-neutral', experimental: 'chip-purple',
  beta: 'chip-accent', gated: 'chip-warn', kill_switch: 'chip-bad',
};

export function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/admin/feature-flags', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setFlags(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function updateRollout(flag: Flag, newPct: number) {
    const r = await fetch(`/api/admin/feature-flags/${flag.key}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rollout_pct: newPct }),
    });
    if (r.ok) { toast.success(`${flag.key} → ${newPct}%`); load(); }
    else toast.error('No se pudo actualizar');
  }

  async function toggleDefault(flag: Flag) {
    const r = await fetch(`/api/admin/feature-flags/${flag.key}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ default_value: !flag.default_value }),
    });
    if (r.ok) { toast.success(`${flag.key} default → ${!flag.default_value}`); load(); }
    else toast.error('No se pudo actualizar');
  }

  if (loading) {
    return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  }

  const grouped = flags.reduce((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {} as Record<string, Flag[]>);

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="surface p-4">
          <header className="mb-3 flex items-center gap-2">
            <span className={cn('chip text-[10px]', CATEGORY_CLS[cat] || 'chip-neutral')}>{cat}</span>
            <h3 className="serif text-[15px] font-semibold">{cat.replace('_', ' ')}</h3>
            <span className="text-[10.5px] muted">{items.length} flags</span>
          </header>
          <div className="grid gap-2">
            {items.map((f) => (
              <div key={f.key} className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-[12px]">{f.key}</strong>
                    <span className="text-[12px]">{f.name}</span>
                  </div>
                  {f.description && <div className="text-[11px] muted">{f.description}</div>}
                  {f.override_count > 0 && (
                    <div className="text-[10.5px] text-warn">{f.override_count} override(s) por firm</div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-[11px]">
                  Default:
                  <button
                    onClick={() => toggleDefault(f)}
                    className={cn('chip cursor-pointer text-[10px]', f.default_value ? 'chip-ok' : 'chip-neutral')}
                  >
                    {f.default_value ? 'ON' : 'OFF'}
                  </button>
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  Rollout:
                  <input
                    type="range" min={0} max={100} step={5}
                    value={f.rollout_pct}
                    onChange={(e) => updateRollout(f, Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="font-mono w-8 text-right">{f.rollout_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
