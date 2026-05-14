'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { IntakeFormsList } from './IntakeFormsList';
import { IntakeSubmissionsList } from './IntakeSubmissionsList';

type Form = { id: string; name: string; submissions_count: number };

const TABS = ['Formularios', 'Submissions'] as const;
type Tab = (typeof TABS)[number];

export function IntakeAdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('Formularios');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [forms, setForms] = useState<Form[]>([]);

  useEffect(() => {
    void (async () => {
      const r = await fetch('/api/intake-forms', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        const items = (data.items || []) as Form[];
        setForms(items);
        if (!selectedFormId && items.length > 0) {
          const firstForm = items[0];
          if (firstForm) setSelectedFormId(firstForm.id);
        }
      }
    })();
  }, [selectedFormId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-0 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
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

      {activeTab === 'Formularios' && (
        <IntakeFormsList
          onSelectForm={(id) => {
            setSelectedFormId(id);
            setActiveTab('Submissions');
          }}
        />
      )}

      {activeTab === 'Submissions' && (
        <div className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <h2 className="serif m-0 text-[15px] font-semibold">Respuestas recibidas</h2>
            <select
              className="input w-auto text-[12px]"
              value={selectedFormId || ''}
              onChange={(ev) => setSelectedFormId(ev.target.value)}
            >
              {forms.length === 0 && <option value="">Sin formularios</option>}
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.submissions_count})
                </option>
              ))}
            </select>
          </header>
          {selectedFormId ? (
            <IntakeSubmissionsList formId={selectedFormId} />
          ) : (
            <div className="rounded-md border border-dashed border-line p-8 text-center text-[12.5px] muted">
              Selecciona un formulario para ver sus submissions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
