'use client';

import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '@/components/atoms/icons';

type SearchResult = {
  matters: Array<{ id: string; display_id: string; titulo: string; materia: string; expediente: string | null }>;
  clients: Array<{ id: string; nombre: string; tax_id: string | null; personal_id: string | null }>;
  documents: Array<{ id: string; matter_id: string; titulo: string; kind: string }>;
  sentencias: Array<{ id: string; numero: string; corte: string; rubro: string | null }>;
};

const EMPTY: SearchResult = { matters: [], clients: [], documents: [], sentencias: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>(EMPTY);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cmdk/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* ignore */
      }
    }, 120);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed left-1/2 top-[15%] z-[100] w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-bg-elev shadow-3"
    >
      <Command shouldFilter={false} className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-line p-[16px_18px]">
          <span className="inline-flex muted">{Ic.search}</span>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Busca casos, clientes, documentos, jurisprudencia…"
            className="flex-1 bg-transparent text-[15px] outline-none"
          />
          <span className="kbd">esc</span>
        </div>
        <Command.List className="max-h-[420px] overflow-auto p-[6px_0]">
          {query.length < 2 ? (
            <>
              <Group heading="Acciones rápidas">
                <Item value="action-dictado" icon={Ic.bolt} title="Nuevo dictado" sub="Voice + Live Canvas" k="⌘ D" onSelect={() => go('/inicio')} />
                <Item value="action-juris" icon={Ic.scales} title="Buscar jurisprudencia" sub="Corte Const. · Suprema · Consejo Estado" k="⌘ J" onSelect={() => go('/casos')} />
                <Item value="action-upload" icon={Ic.upload} title="Subir documento" sub="PDF · OCR automático" k="⌘ U" onSelect={() => go('/documentos')} />
                <Item value="action-export" icon={Ic.download} title="Exportar a Word" sub="con disclaimer + SHA-256" k="⌘ E" onSelect={() => go('/documentos')} />
              </Group>
              <Group heading="Configuración">
                <Item value="cfg-despacho" icon={Ic.users} title="Despacho" onSelect={() => go('/settings/despacho')} />
                <Item value="cfg-privacy" icon={Ic.shield} title="Habeas Data · ARCO" onSelect={() => go('/settings/privacidad')} />
                <Item value="cfg-audit" icon={Ic.badge} title="Audit log" onSelect={() => go('/settings/despacho')} />
              </Group>
            </>
          ) : (
            <>
              {results.matters.length > 0 && (
                <Group heading={`Casos (${results.matters.length})`}>
                  {results.matters.map((m) => (
                    <Item
                      key={m.id}
                      value={`matter-${m.id}`}
                      icon={Ic.folder}
                      title={m.titulo}
                      sub={`${m.materia} · ${m.display_id} · Exp. ${m.expediente ?? '—'}`}
                      onSelect={() => go(`/casos/${m.id}`)}
                    />
                  ))}
                </Group>
              )}
              {results.clients.length > 0 && (
                <Group heading={`Clientes (${results.clients.length})`}>
                  {results.clients.map((c) => (
                    <Item
                      key={c.id}
                      value={`client-${c.id}`}
                      icon={Ic.user}
                      title={c.nombre}
                      sub={c.tax_id ?? c.personal_id ?? ''}
                      onSelect={() => go(`/clientes/${c.id}`)}
                    />
                  ))}
                </Group>
              )}
              {results.documents.length > 0 && (
                <Group heading={`Documentos (${results.documents.length})`}>
                  {results.documents.map((d) => (
                    <Item
                      key={d.id}
                      value={`doc-${d.id}`}
                      icon={Ic.doc}
                      title={d.titulo}
                      sub={d.kind}
                      onSelect={() => go(`/casos/${d.matter_id}`)}
                    />
                  ))}
                </Group>
              )}
              {results.sentencias.length > 0 && (
                <Group heading={`Jurisprudencia (${results.sentencias.length})`}>
                  {results.sentencias.map((s) => (
                    <Item
                      key={s.id}
                      value={`sent-${s.id}`}
                      icon={Ic.scales}
                      title={s.numero}
                      sub={(s.rubro ?? '').slice(0, 80)}
                      onSelect={() => go(`/casos`)}
                    />
                  ))}
                </Group>
              )}
              {results.matters.length === 0 &&
                results.clients.length === 0 &&
                results.documents.length === 0 &&
                results.sentencias.length === 0 && (
                  <div className="p-4 text-center text-[12.5px] muted">
                    Sin resultados para &ldquo;{query}&rdquo;
                  </div>
                )}
            </>
          )}
        </Command.List>
        <div className="flex items-center gap-3 border-t border-line bg-bg-sunken p-[10px_16px] text-[11px] muted">
          <span><span className="kbd">↑</span><span className="kbd">↓</span> navegar</span>
          <span><span className="kbd">⏎</span> ejecutar</span>
          <span className="ml-auto">Postgres FTS · &lt; 100ms</span>
        </div>
      </Command>
    </Command.Dialog>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="text-[10.5px] uppercase tracking-wider muted px-[18px] pt-[10px] pb-[4px]"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  value, icon, title, sub, k, onSelect,
}: {
  value?: string; icon: React.ReactNode; title: string; sub?: string; k?: string; onSelect?: () => void;
}) {
  return (
    <Command.Item
      value={value ?? title}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 px-[18px] py-[9px] text-ink data-[selected=true]:bg-accent-soft"
    >
      <span className="text-ink-3">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium">{title}</div>
        {sub && <div className="line-clamp-1 text-[11.5px] muted">{sub}</div>}
      </div>
      {k && <span className="kbd text-[11px]">{k}</span>}
    </Command.Item>
  );
}
