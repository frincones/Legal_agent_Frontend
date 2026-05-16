'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Loader2, Globe } from 'lucide-react';

export default function JurisdictionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/saas/jurisdictions').then(r => r.ok ? r.json() : []).then(setItems).finally(() => setLoading(false));
  }, []);
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={<><Link href="/saas">SaaS Admin</Link> · <span className="text-accent">Jurisdicciones</span></>}
          title="Jurisdicciones disponibles"
          subtitle="Países/regiones que las skills pueden usar como contexto legal · activación expansión LATAM"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="surface overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead className="bg-bg-2"><tr>
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">País</th>
                  <th className="text-left p-2">Estado</th>
                </tr></thead>
                <tbody>
                  {items.map(j => (
                    <tr key={j.code} className="border-t">
                      <td className="p-2 mono">{j.code}</td>
                      <td className="p-2 font-medium">
                        <Globe size={12} className="inline mr-1" /> {j.name}
                      </td>
                      <td className="p-2">
                        <span className={`chip text-[10px] ${j.active ? 'chip-green' : ''}`}>
                          {j.active ? 'Activa' : 'Próximamente'}
                        </span>
                        {j.default && <span className="chip chip-blue text-[10px] ml-1">Default</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
