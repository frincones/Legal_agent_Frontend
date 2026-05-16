'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Loader2, BookOpen, Copy } from 'lucide-react';

export default function PlaybookTemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/saas/playbook-templates').then(r => r.ok ? r.json() : []).then(setItems).finally(() => setLoading(false));
  }, []);
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Playbook Templates</span></>}
          title="Plantillas de playbook"
          subtitle="Plantillas que las firmas pueden adoptar como base de su CLAUDE.md"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)] grid gap-3">
          {loading ? <Loader2 className="animate-spin" /> : items.map(t => (
            <div key={t.id} className="surface p-4 grid gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="serif text-[15px] font-semibold flex items-center gap-2">
                    <BookOpen size={14} /> {t.name}
                  </h3>
                  <p className="text-[12.5px] muted">{t.description}</p>
                </div>
                <span className="chip text-[10px]">{t.jurisdiction_default}</span>
              </div>
              {t.forbidden_terms?.length > 0 && (
                <div className="text-[11.5px]">
                  <strong>Forbidden:</strong>{' '}
                  {t.forbidden_terms.map((f: string) => <code key={f} className="mono text-[10px] chip ml-1">{f}</code>)}
                </div>
              )}
              {t.required_clauses?.length > 0 && (
                <div className="text-[11.5px]">
                  <strong>Required:</strong>{' '}
                  {t.required_clauses.map((c: string) => <code key={c} className="mono text-[10px] chip ml-1">{c}</code>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
