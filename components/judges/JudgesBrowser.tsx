'use client';

import { useState } from 'react';
import { JudgeSearchPicker, type JudgeLite } from './JudgeSearchPicker';
import { JudgeProfileCard } from './JudgeProfileCard';

export function JudgesBrowser() {
  const [selected, setSelected] = useState<JudgeLite | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="surface p-3">
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
          Buscar juez
        </div>
        <JudgeSearchPicker
          mode="embedded"
          selectedId={selected?.id || null}
          onSelect={setSelected}
        />
      </aside>
      <div className="min-w-0">
        {selected ? (
          <JudgeProfileCard judgeId={selected.id} />
        ) : (
          <div className="surface flex flex-col items-center justify-center gap-2 p-10 text-center">
            <div className="text-[14px] font-medium">Selecciona un juez</div>
            <p className="max-w-md text-[12.5px] muted">
              Usa el buscador a la izquierda para encontrar magistrados de la Corte
              Constitucional, Corte Suprema, Consejo de Estado o tribunales.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
