'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Loader2, Shield } from 'lucide-react';

export default function RedlinePoliciesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/saas/redline-policies').then(r => r.ok ? r.json() : null).then(setData).finally(() => setLoading(false));
  }, []);
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Redline Policies</span></>}
          title="Políticas globales de redline"
          subtitle="Forbidden terms y required clauses que TODAS las firmas heredan por defecto"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)] grid gap-4">
          {loading ? <Loader2 className="animate-spin" /> : data && (
            <>
              <div className="surface p-4">
                <h3 className="serif text-[15px] font-semibold flex items-center gap-2 mb-2">
                  <Shield size={14} /> Forbidden terms global
                </h3>
                {data.forbidden_terms_global?.length ? (
                  <ul>{data.forbidden_terms_global.map((t: string) => <li key={t} className="mono text-[12px]">· {t}</li>)}</ul>
                ) : (
                  <p className="text-[12px] muted">Sin términos prohibidos globales</p>
                )}
              </div>
              <div className="surface p-4">
                <h3 className="serif text-[15px] font-semibold mb-2">Required clauses global</h3>
                {data.required_clauses_global?.length ? (
                  <ul>{data.required_clauses_global.map((t: string) => <li key={t} className="mono text-[12px]">· {t}</li>)}</ul>
                ) : (
                  <p className="text-[12px] muted">Sin cláusulas obligatorias globales</p>
                )}
              </div>
              {data.notes && (
                <p className="text-[11.5px] muted italic">{data.notes}</p>
              )}
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
