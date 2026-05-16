'use client';

import { useEffect, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';

export function RedlinePoliciesView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/saas/redline-policies').then(r => r.ok ? r.json() : null).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="surface p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando…</div>;
  if (!data) return null;

  return (
    <div className="grid gap-4">
      <div className="surface p-4">
        <h3 className="serif text-[15px] font-semibold flex items-center gap-2 mb-2">
          <Shield size={14} /> Forbidden terms global
        </h3>
        {data.forbidden_terms_global?.length ? (
          <ul>{data.forbidden_terms_global.map((t: string) => <li key={t} className="mono text-[12px]">· {t}</li>)}</ul>
        ) : <p className="text-[12px] muted">Sin términos prohibidos globales</p>}
      </div>
      <div className="surface p-4">
        <h3 className="serif text-[15px] font-semibold mb-2">Required clauses global</h3>
        {data.required_clauses_global?.length ? (
          <ul>{data.required_clauses_global.map((t: string) => <li key={t} className="mono text-[12px]">· {t}</li>)}</ul>
        ) : <p className="text-[12px] muted">Sin cláusulas globales</p>}
      </div>
      {data.notes && <p className="text-[11.5px] muted italic">{data.notes}</p>}
    </div>
  );
}
