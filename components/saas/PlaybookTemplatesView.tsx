'use client';

import { BookOpen } from 'lucide-react';
import { SimpleListView } from './SimpleListView';

export function PlaybookTemplatesView() {
  return (
    <SimpleListView
      endpoint="/api/saas/playbook-templates"
      renderItem={(t) => (
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
              <strong>Forbidden:</strong>
              {t.forbidden_terms.map((f: string) => <code key={f} className="mono text-[10px] chip ml-1">{f}</code>)}
            </div>
          )}
          {t.required_clauses?.length > 0 && (
            <div className="text-[11.5px]">
              <strong>Required:</strong>
              {t.required_clauses.map((c: string) => <code key={c} className="mono text-[10px] chip ml-1">{c}</code>)}
            </div>
          )}
        </div>
      )}
    />
  );
}
