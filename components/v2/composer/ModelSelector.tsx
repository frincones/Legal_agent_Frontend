'use client';

/**
 * F3-T03 · LexAI UX v2 — ModelSelector
 *
 * Dropdown compacto para elegir el modelo LLM que el composer va a usar.
 * Persiste la selección en localStorage key "lexai-v2-composer-model".
 *
 * Flag: NEXT_PUBLIC_UX_V2_COMPOSER
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export type ComposerModel =
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'gpt-realtime'
  | 'text-embedding-3-large';

export interface ModelOption {
  id: ComposerModel;
  label: string;
  description: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o',                label: 'GPT-4o',             description: 'Balanceado · rápido' },
  { id: 'gpt-4-turbo',           label: 'GPT-4 Turbo',        description: 'Más profundo · más lento' },
  { id: 'gpt-realtime',          label: 'GPT-Realtime',        description: 'Para dictado y conversación' },
  { id: 'text-embedding-3-large', label: 'Embedding-3-large', description: 'Para búsqueda semántica' },
];

const STORAGE_KEY = 'lexai-v2-composer-model';

interface ModelSelectorProps {
  onChangeModel?: (model: ComposerModel) => void;
}

export function ModelSelector({ onChangeModel }: ModelSelectorProps) {
  const [selected, setSelected] = useState<ComposerModel>('gpt-4o');
  const hydrated = useRef(false);

  // Hydrate from localStorage once (client only)
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ComposerModel | null;
      if (stored && MODEL_OPTIONS.some((m) => m.id === stored)) {
        setSelected(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelect = (model: ComposerModel) => {
    setSelected(model);
    try {
      localStorage.setItem(STORAGE_KEY, model);
    } catch {
      // ignore
    }
    onChangeModel?.(model);
  };

  const currentLabel = MODEL_OPTIONS.find((m) => m.id === selected)?.label ?? 'GPT-4o';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Modelo seleccionado: ${currentLabel}. Click para cambiar`}
          className={[
            'flex items-center gap-1 rounded-md px-2 py-1',
            'text-[11px] font-medium text-[color:var(--v2-text-secondary,#4A4944)]',
            'hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]',
            'transition-colors duration-150',
          ].join(' ')}
        >
          {currentLabel}
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={4}
          className={[
            'z-[200] min-w-[200px] rounded-xl p-1',
            'bg-white shadow-lg border border-[color:var(--v2-border-subtle,#E8E6DF)]',
            'animate-in fade-in-0 zoom-in-95',
          ].join(' ')}
        >
          <DropdownMenu.RadioGroup value={selected} onValueChange={(v) => handleSelect(v as ComposerModel)}>
            {MODEL_OPTIONS.map((opt) => (
              <DropdownMenu.RadioItem
                key={opt.id}
                value={opt.id}
                className={[
                  'flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer',
                  'text-[color:var(--v2-text-primary,#1A1916)]',
                  'hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)]',
                  'focus:outline-none focus-visible:bg-[color:var(--v2-bg-subtle,#F2F1EC)]',
                  'transition-colors duration-100',
                ].join(' ')}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {selected === opt.id && (
                    <Check className="h-3.5 w-3.5 text-[color:var(--v2-accent-copper,#B8763C)]" aria-hidden />
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="text-[13px] font-medium leading-tight">{opt.label}</span>
                  <span className="text-[11px] text-[color:var(--v2-text-tertiary,#7A7870)] leading-tight">
                    {opt.description}
                  </span>
                </span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
