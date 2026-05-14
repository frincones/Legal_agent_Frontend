'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, ExternalLink, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Template = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  brand_color: string;
  is_system: boolean;
  active: boolean;
  sessions_count: number;
  completions_count: number;
};

type Session = {
  id: string;
  wizard_template_id: string;
  template_name: string | null;
  template_slug: string | null;
  session_token: string;
  status: string;
  submitted_action: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  routed_to_lead_id: string | null;
  routed_to_email: string | null;
  created_at: string;
  completed_at: string | null;
  answers_summary: Record<string, string>;
};

type Stats = {
  templates_total?: number;
  templates_custom?: number;
  sessions_total?: number;
  sessions_completed?: number;
  leads_created?: number;
  sessions_30d?: number;
};

const STATUS_CHIP: Record<string, string> = {
  in_progress: 'chip-blue',
  completed: 'chip-green',
  submitted: 'chip-purple',
  abandoned: 'chip-neutral',
  error: 'chip-danger',
};

const STATUS_LABEL: Record<string, string> = {
  in_progress: 'En progreso',
  completed: 'Completada',
  submitted: 'Enviada',
  abandoned: 'Abandonada',
  error: 'Error',
};

export function WizardsAdminPanel() {
  const [activeTab, setActiveTab] = useState<'Plantillas' | 'Sesiones'>('Plantillas');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [tR, sR, statsR] = await Promise.all([
        fetch('/api/wizard-templates', { cache: 'no-store' }),
        fetch(`/api/wizard-sessions${statusFilter ? `?status=${statusFilter}` : ''}`, { cache: 'no-store' }),
        fetch('/api/wizard-templates/stats', { cache: 'no-store' }),
      ]);
      if (tR.ok) setTemplates((await tR.json()).items || []);
      if (sR.ok) setSessions((await sR.json()).items || []);
      if (statsR.ok) setStats(await statsR.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  function copyPublicUrl(slug: string) {
    const url = `${window.location.origin}/tramites/${slug}`;
    void navigator.clipboard.writeText(url);
    toast.success('URL pública copiada');
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Plantillas totales" value={stats.templates_total ?? 0} />
        <KpiCard label="Plantillas custom" value={stats.templates_custom ?? 0} />
        <KpiCard label="Sesiones total" value={stats.sessions_total ?? 0} />
        <KpiCard label="Leads convertidos" value={stats.leads_created ?? 0} tone="ok" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 overflow-x-auto border-b border-line">
        {(['Plantillas', 'Sesiones'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'mb-[-1px] flex-none cursor-pointer border-b-2 border-transparent bg-transparent px-3 py-[10px] text-[13px] font-medium text-ink-3 transition hover:text-ink',
              activeTab === t && 'border-accent text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Templates list */}
      {activeTab === 'Plantillas' && (
        <div className="flex flex-col gap-2">
          {loading ? (
            <Loader2 className="mx-auto animate-spin text-ink-3" size={20} />
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-md border border-line bg-bg-elev p-3">
                <span className="text-[28px]">{t.icon || '📄'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[13.5px] font-semibold">{t.name}</span>
                    {t.is_system && <span className="chip chip-purple text-[10px]">system</span>}
                    {!t.active && <span className="chip chip-neutral text-[10px]">inactivo</span>}
                    <span className="text-[10.5px] muted">/tramites/{t.slug}</span>
                    <button
                      onClick={() => copyPublicUrl(t.slug)}
                      className="btn btn-icon btn-ghost btn-sm"
                      title="Copiar URL pública"
                    >
                      <Copy size={11} />
                    </button>
                    <a
                      href={`/tramites/${t.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="btn btn-icon btn-ghost btn-sm"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <p className="text-[12px] muted">{t.description}</p>
                  <div className="mt-0.5 text-[10.5px] text-ink-3">
                    {t.sessions_count} sesiones · {t.completions_count} completadas
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sessions list */}
      {activeTab === 'Sesiones' && (
        <div className="flex flex-col gap-2">
          <header className="flex items-center gap-1">
            {(['', 'completed', 'submitted', 'in_progress', 'abandoned'] as const).map((f) => (
              <button
                key={f || 'all'}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11.5px]',
                  statusFilter === f ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
                )}
              >
                {f === '' ? 'Todas' : STATUS_LABEL[f] || f}
              </button>
            ))}
          </header>
          {loading ? (
            <Loader2 className="mx-auto animate-spin text-ink-3" size={20} />
          ) : sessions.length === 0 ? (
            <div className="rounded-md border border-dashed border-line p-8 text-center">
              <Inbox className="mx-auto text-ink-3" size={20} />
              <div className="mt-2 text-[12.5px] muted">Sin sesiones en este filtro</div>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {sessions.map((s) => (
                <li key={s.id} className="rounded-md border border-line bg-bg-elev px-3 py-2">
                  <header className="flex flex-wrap items-baseline gap-2">
                    <span className={cn('chip text-[10px]', STATUS_CHIP[s.status])}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                    <span className="text-[12.5px] font-semibold">
                      {s.submitter_name || s.answers_summary.nombre || 'Anónimo'}
                    </span>
                    <span className="text-[11px] muted">· {s.template_name}</span>
                    <span className="ml-auto text-[10.5px] muted">
                      {formatRelative(s.created_at)}
                    </span>
                  </header>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-2">
                    {s.submitter_email && <span>📧 {s.submitter_email}</span>}
                    {s.answers_summary.cedula && <span>C.C. {s.answers_summary.cedula}</span>}
                    {s.submitted_action && (
                      <span className="text-accent">→ {s.submitted_action}</span>
                    )}
                  </div>
                  {s.routed_to_lead_id && (
                    <Link href="/leads" className="mt-1 inline-block text-[11px] text-accent hover:underline">
                      Ver lead creado →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'ok' }) {
  return (
    <div className="surface p-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className={cn('serif tabular mt-1 text-[22px] font-semibold leading-none',
        tone === 'ok' ? 'text-ok' : 'text-ink',
      )}>{value}</div>
    </div>
  );
}
