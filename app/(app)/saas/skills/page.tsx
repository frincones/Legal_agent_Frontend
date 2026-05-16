'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, FileText, BookOpen, Plus, Edit, Trash2, Loader2,
  Play, Activity, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';

type Skill = {
  id: string;
  command: string;
  name: string;
  description: string | null;
  category: string;
  jurisdiction: string;
  status: 'draft' | 'published' | 'deprecated' | 'archived';
  version: number;
  user_invocable: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export default function SaasSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const r = await fetch(`/api/saas/skills?${params}`, { cache: 'no-store' });
      if (r.ok) setSkills(await r.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function deleteSkill(id: string) {
    if (!confirm('¿Archivar esta skill builtin?')) return;
    const r = await fetch(`/api/saas/skills/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Skill archivada'); void refresh(); }
    else toast.error('Error');
  }

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Skills</span></>}
          title="Skills builtin · catálogo global"
          subtitle="Gestiona las skills (drafting + review) disponibles para todas las firmas."
          actions={
            <Link href="/saas/skills/new" className="btn btn-primary">
              <Plus size={14} /> Nueva skill
            </Link>
          }
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)] grid gap-4">
          <div className="surface p-3 flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-ink-3" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Todos los estados</option>
              <option value="draft">Draft</option>
              <option value="published">Publicada</option>
              <option value="deprecated">Deprecada</option>
              <option value="archived">Archivada</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">Todas las categorías</option>
              <option value="drafting">Drafting</option>
              <option value="review">Review</option>
              <option value="analysis">Analysis</option>
              <option value="other">Otra</option>
            </select>
            <span className="ml-auto text-[11.5px] muted">{skills.length} skills</span>
            <Link href="/saas/skills-metrics" className="btn btn-sm">
              <Activity size={12} /> Métricas
            </Link>
          </div>

          {loading ? (
            <div className="surface p-4 flex items-center gap-2 text-[12px] muted">
              <Loader2 size={14} className="animate-spin" /> Cargando…
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-bg-2">
                  <tr>
                    <th className="text-left p-2">Comando</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">Categoría</th>
                    <th className="text-left p-2">Jurisdicción</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">v</th>
                    <th className="text-right p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map(s => (
                    <tr key={s.id} className="border-t hover:bg-bg-2">
                      <td className="p-2"><code className="mono">{s.command}</code></td>
                      <td className="p-2 font-medium">{s.name}</td>
                      <td className="p-2"><span className="chip text-[10px]">{s.category}</span></td>
                      <td className="p-2">{s.jurisdiction}</td>
                      <td className="p-2">
                        <span className={`chip text-[10px] ${
                          s.status === 'published' ? 'chip-green' :
                          s.status === 'draft' ? 'chip-amber' :
                          ''
                        }`}>{s.status}</span>
                      </td>
                      <td className="p-2 muted">{s.version}</td>
                      <td className="p-2 text-right">
                        <Link href={`/saas/skills/${s.id}/editor`} className="btn btn-sm">
                          <Edit size={11} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteSkill(s.id)}
                          className="btn btn-sm ml-1"
                          title="Archivar"
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {skills.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[12px] muted">
                        Sin skills con estos filtros. Crea una con "Nueva skill" arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
