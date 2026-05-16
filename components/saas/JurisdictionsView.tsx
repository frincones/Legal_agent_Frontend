'use client';

import { Globe } from 'lucide-react';
import { SimpleListView } from './SimpleListView';

export function JurisdictionsView() {
  return (
    <SimpleListView
      endpoint="/api/saas/jurisdictions"
      renderItem={(j) => (
        <div key={j.code} className="surface p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-accent" />
            <code className="mono text-[12px]">{j.code}</code>
            <span className="font-medium text-[13px]">{j.name}</span>
          </div>
          <div className="flex gap-1">
            <span className={`chip text-[10px] ${j.active ? 'chip-green' : ''}`}>
              {j.active ? 'Activa' : 'Próximamente'}
            </span>
            {j.default && <span className="chip chip-blue text-[10px]">Default</span>}
          </div>
        </div>
      )}
    />
  );
}
