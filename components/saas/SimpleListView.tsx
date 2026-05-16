'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function SimpleListView({
  endpoint,
  emptyMessage,
  renderItem,
}: {
  endpoint: string;
  emptyMessage?: string;
  renderItem: (item: any, index: number) => React.ReactNode;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(endpoint).then(r => r.ok ? r.json() : []).then(data => {
      setItems(Array.isArray(data) ? data : [data]);
    }).finally(() => setLoading(false));
  }, [endpoint]);

  if (loading) return <div className="surface p-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando…</div>;
  if (items.length === 0) return <div className="surface p-6 text-center text-[12px] muted">{emptyMessage || 'Sin elementos'}</div>;

  return <div className="grid gap-3">{items.map((item, i) => renderItem(item, i))}</div>;
}
