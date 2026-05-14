'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type FirmUser = {
  id: string;
  full_name: string;
  email: string | null;
};

let userCachePromise: Promise<FirmUser[]> | null = null;

async function loadFirmUsers(): Promise<FirmUser[]> {
  if (!userCachePromise) {
    userCachePromise = (async () => {
      try {
        const r = await fetch('/api/firm-users', { cache: 'no-store' });
        if (!r.ok) return [];
        const data = await r.json();
        return (data.items || data.users || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name || u.fullName || '',
          email: u.email || null,
        }));
      } catch {
        return [];
      }
    })();
  }
  return userCachePromise;
}

/**
 * Sprint 16 · Textarea con popover de @mentions.
 *
 * Cuando el usuario teclea `@`, abre una lista filtrada de miembros del
 * despacho. Al elegir uno, inserta `@firstname.lastname` (o `@"Nombre Completo"`
 * si tiene espacios) en el cursor.
 *
 * El parsing real de menciones lo hace el backend (utils/mentions.py) ·
 * acá sólo facilitamos teclearlas.
 */
export function MentionAwareTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  disabled = false,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  /** Si se da, Cmd/Ctrl+Enter invoca submit. */
  onSubmit?: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [users, setUsers] = useState<FirmUser[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    void loadFirmUsers().then(setUsers);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users
      .filter((u) => {
        const name = (u.full_name || '').toLowerCase();
        const emailPart = (u.email || '').split('@')[0]?.toLowerCase() || '';
        return name.includes(q) || emailPart.includes(q);
      })
      .slice(0, 8);
  }, [users, query]);

  const closePicker = useCallback(() => {
    setOpen(false);
    setQuery('');
    setAnchorPos(null);
    setSelectedIdx(0);
  }, []);

  const handleChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = ev.target.value;
    onChange(newVal);
    const ta = taRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? newVal.length;
    // Encuentra @ más cercano hacia atrás · sin espacio entre @ y caret
    let i = caret - 1;
    let token = '';
    while (i >= 0) {
      const ch = newVal[i] || '';
      if (ch === '@') {
        if (i === 0 || /\s/.test(newVal[i - 1] || '')) {
          setQuery(token);
          setOpen(true);
          setSelectedIdx(0);
          // Calcular posición · best effort usando el tamaño de la textarea
          const r = ta.getBoundingClientRect();
          setAnchorPos({
            top: r.bottom + window.scrollY + 4,
            left: r.left + window.scrollX + 12,
          });
          return;
        }
        break;
      }
      if (/\s/.test(ch)) break;
      token = ch + token;
      i--;
    }
    closePicker();
  };

  const insertMention = (u: FirmUser) => {
    const ta = taRef.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? value.length;
    let i = caret - 1;
    while (i >= 0 && value[i] !== '@') i--;
    if (i < 0) return;
    const before = value.slice(0, i);
    const after = value.slice(caret);
    const name = (u.full_name || '').trim();
    const handle = name.includes(' ')
      ? `"${name}"`
      : name || (u.email || '').split('@')[0] || u.id;
    const inserted = `@${handle} `;
    const next = before + inserted + after;
    onChange(next);
    closePicker();
    // re-foco + cursor después del mention
    setTimeout(() => {
      ta.focus();
      const pos = (before + inserted).length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onSubmit && (ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
      ev.preventDefault();
      onSubmit();
      return;
    }
    if (!open) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setSelectedIdx((p) => Math.min(filtered.length - 1, p + 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setSelectedIdx((p) => Math.max(0, p - 1));
    } else if (ev.key === 'Enter' || ev.key === 'Tab') {
      const u = filtered[selectedIdx];
      if (u) {
        ev.preventDefault();
        insertMention(u);
      }
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      closePicker();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn('input min-h-[80px] resize-y', className)}
      />
      {open && anchorPos && filtered.length > 0 && (
        <ul
          className="fixed z-[60] max-h-[220px] w-[260px] overflow-y-auto rounded-md border border-line bg-bg-elev shadow-2"
          style={{ top: anchorPos.top, left: anchorPos.left }}
        >
          {filtered.map((u, i) => (
            <li key={u.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px]',
                  i === selectedIdx ? 'bg-bg-sunken' : 'hover:bg-bg-sunken',
                )}
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {(u.full_name || u.email || '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate">{u.full_name}</span>
                {u.email && <span className="text-[10.5px] muted">{u.email.split('@')[0]}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
