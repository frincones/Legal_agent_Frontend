'use client';

/**
 * Sprint E · SlashCommandPalette
 *
 * Palette ⌘K · lista skills disponibles · invoca skill seleccionada.
 * Permite acceso rápido a /redactar/* y /revisar/* desde cualquier parte.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Sparkles, FileText, BookOpen, Loader2 } from 'lucide-react';

type Skill = {
  id: string;
  command: string;
  name: string;
  description: string | null;
  category: string;
  jurisdiction: string;
  user_invocable: boolean;
  is_custom: boolean;
};

const CATEGORY_ICONS: Record<string, any> = {
  drafting: FileText,
  review: BookOpen,
  other: Sparkles,
};

export function SlashCommandPalette({
  open,
  onOpenChange,
  matterId,
  onSkillSelected,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  matterId?: string;
  onSkillSelected?: (skill: Skill, prompt: string) => void;
}) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/skills', { cache: 'no-store' });
      if (r.ok) setSkills(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadSkills();
  }, [open, loadSkills]);

  useEffect(() => {
    if (!open) {
      setFilter('');
      setActiveIndex(0);
    }
  }, [open]);

  // El filtro busca tanto por comando-prefijo como por texto libre.
  // Lo que el usuario escribe DESPUÉS del comando se considera el prompt
  // adicional que se enviará al skill como contexto extra.
  const isCommandSearch = filter.trim().startsWith('/');
  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return skills.filter(s => s.user_invocable);
    if (isCommandSearch) {
      // Match por prefijo del comando exacto.
      return skills.filter(s =>
        s.user_invocable && s.command.toLowerCase().startsWith(q),
      );
    }
    return skills.filter(s =>
      s.user_invocable &&
      (s.command.toLowerCase().includes(q) ||
       s.name.toLowerCase().includes(q) ||
       (s.description || '').toLowerCase().includes(q))
    );
  }, [skills, filter, isCommandSearch]);

  function selectSkill(skill: Skill) {
    // Si el usuario escribió en lenguaje natural (no /comando), se usa como prompt.
    const promptText = isCommandSearch ? '' : filter.trim();
    onSkillSelected?.(skill, promptText);
    onOpenChange(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const skill = filtered[activeIndex];
      if (skill) selectSkill(skill);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby="slash-palette-desc"
          className="fixed left-1/2 top-[20vh] z-50 w-full max-w-xl -translate-x-1/2 surface p-0 overflow-hidden"
        >
          <Dialog.Title className="sr-only">Paleta de skills LexAI</Dialog.Title>
          <Dialog.Description id="slash-palette-desc" className="sr-only">
            Buscar y ejecutar skills · / para comandos, texto libre como prompt
          </Dialog.Description>
          <div className="border-b p-3 flex items-center gap-2">
            <Search size={14} className="text-ink-3" />
            <input
              autoFocus
              value={filter}
              onChange={e => setFilter(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="/comando o describe lo que quieres…"
              className="flex-1 bg-transparent outline-none text-[14px]"
            />
            <kbd className="text-[10px] muted">ESC</kbd>
          </div>

          <div className="max-h-[50vh] overflow-auto">
            {loading ? (
              <div className="p-4 flex items-center gap-2 text-[12px] muted">
                <Loader2 size={12} className="animate-spin" /> Cargando skills…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-[12px] muted text-center">
                Sin skills disponibles · pídeles a tu admin SaaS publicar nuevas
              </div>
            ) : (
              <ul>
                {filtered.map((s, i) => {
                  const Icon = CATEGORY_ICONS[s.category] || CATEGORY_ICONS.other;
                  return (
                    <li
                      key={s.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer ${
                        i === activeIndex ? 'bg-bg-2' : ''
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => selectSkill(s)}
                    >
                      <Icon size={14} className="flex-none text-accent" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="mono text-[11.5px]">{s.command}</code>
                          {s.is_custom && (
                            <span className="chip text-[10px]">custom</span>
                          )}
                        </div>
                        <div className="text-[12.5px] font-medium truncate">{s.name}</div>
                        {s.description && (
                          <div className="text-[11.5px] muted truncate">{s.description}</div>
                        )}
                      </div>
                      <span className="chip text-[10px]">{s.category}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t p-2 flex items-center justify-between text-[10.5px] muted">
            <div className="flex items-center gap-2">
              <kbd>↑↓</kbd> navegar
              <kbd>↵</kbd> ejecutar
            </div>
            <div>{filtered.length} skills</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
