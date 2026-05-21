'use client';

/**
 * F1-T08 / F1-T09 · LexAI UX v2 — CommandPaletteV2
 *
 * Command palette Cmd+K enriquecido con grupos:
 *   Casos (#)          → top 10 casos del firm
 *   Partes (@)         → top 10 clientes/contrapartes
 *   Skills (/)         → todas las skills del firm
 *   Documentos         → top 10 documentos recientes
 *   Plazos             → próximos 7 días
 *   Jurisprudencia     → solo si query ≥ 3 chars
 *   Normativa          → solo si query ≥ 3 chars (TODO: endpoint /v1/norms/search)
 *   Comandos           → acciones rápidas
 *
 * Wire de voice tools:
 *   TODO: cuando exista GET /v1/voice/tools (o /api/v1/skills/tools), consumirlo aquí.
 *   Por ahora se representan como comandos hardcodeados en VOICE_TOOLS_STUB.
 *
 * Atajos del footer: ⌘N nuevo caso · ⌘D dictado · ⌘L canvas · ↵ abrir · ESC cerrar.
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Folder,
  User,
  Scale,
  Sparkles,
  FileText,
  Calendar,
  BookOpen,
  Gavel,
  Terminal,
  Search,
  Keyboard,
} from 'lucide-react';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type SearchResult = {
  matters: Array<{ id: string; titulo: string; materia: string; display_id: string }>;
  clients: Array<{ id: string; nombre: string; tax_id: string | null }>;
  documents: Array<{ id: string; matter_id: string; titulo: string; kind: string }>;
  sentencias: Array<{ id: string; numero: string; corte: string; rubro: string | null }>;
};

type Skill = {
  id: string;
  name: string;
  path: string;
  description?: string;
};

type Deadline = {
  id: string;
  titulo: string;
  fecha: string;
  matter_id: string;
};

const EMPTY_RESULTS: SearchResult = { matters: [], clients: [], documents: [], sentencias: [] };

// ────────────────────────────────────────────────────────────────────────────
// Voice tools stub (10 comunes)
// TODO: reemplazar con fetch a GET /v1/voice/tools cuando exista el endpoint.
// El endpoint necesitaría retornar: Array<{ name: string, description: string }>
// ────────────────────────────────────────────────────────────────────────────
const VOICE_TOOLS_STUB = [
  { name: 'add_matter_note',        description: 'Añadir nota a un caso' },
  { name: 'create_task',            description: 'Crear tarea' },
  { name: 'search_law',             description: 'Buscar norma legal' },
  { name: 'calculate_liquidacion',  description: 'Calcular liquidación laboral' },
  { name: 'calculate_terminos',     description: 'Calcular términos procesales' },
  { name: 'search_jurisprudencia',  description: 'Buscar jurisprudencia' },
  { name: 'create_document',        description: 'Crear documento desde plantilla' },
  { name: 'list_deadlines',         description: 'Listar plazos próximos' },
  { name: 'get_matter_summary',     description: 'Resumen ejecutivo de caso' },
  { name: 'verify_citations',       description: 'Verificar citas jurídicas' },
];

// ────────────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────────────

export function CommandPaletteV2() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>(EMPTY_RESULTS);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  // ── Abrir/cerrar con Cmd+K / Ctrl+K ─────────────────────────────────────
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

  // ── Cargar skills al montar ──────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/skills', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const raw: Array<{ id?: string; name?: string; path?: string; description?: string }> =
          Array.isArray(data) ? data : (data.skills ?? []);
        setSkills(
          raw
            .filter((s) => s.name || s.path)
            .map((s, i) => ({
              id: s.id ?? s.path ?? String(i),
              name: s.name ?? s.path ?? `Skill ${i + 1}`,
              path: s.path ?? s.name ?? '',
              description: s.description,
            })),
        );
      })
      .catch(() => { /* silencioso */ });
  }, []);

  // ── Cargar plazos próximos al montar ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/deadlines?days=7', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.items) setDeadlines(data.items);
      })
      .catch(() => { /* silencioso — endpoint puede no existir */ });
  }, []);

  // ── Búsqueda debounced ───────────────────────────────────────────────────
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cmdk/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch { /* ignore */ }
    }, 140);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const go = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSkillSelect = (skill: Skill) => {
    close();
    window.dispatchEvent(new CustomEvent('v2:skill-select', { detail: { path: skill.path, name: skill.name } }));
    toast.info(`Skill: ${skill.name}`);
  };

  const handleNewCase = () => { close(); go('/casos/nuevo'); };
  const handleDictado = () => {
    close();
    window.dispatchEvent(new CustomEvent('v2:voice-start'));
    toast.info('Dictado activo · habla normal o pulsa Espacio');
  };
  const handleCanvas = () => { close(); go('/canvas'); };

  const isSearching = query.trim().length >= 2;
  const isLongQuery = query.trim().length >= 3;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Búsqueda y comandos"
      className="fixed left-1/2 top-[12%] z-[110] w-[min(640px,92vw)] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-surface,#FFFFFF)] shadow-xl"
    >
      <Command shouldFilter={false} className="flex flex-col">

        {/* ── Input ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-[var(--v2-border-subtle,#E8E7E1)] px-[18px] py-[14px]">
          <Search size={16} className="shrink-0 text-[var(--v2-text-tertiary,#807E76)]" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar casos, partes, jueces, skills..."
            className="flex-1 bg-transparent text-[15px] text-[var(--v2-text-primary,#1A1916)] outline-none placeholder:text-[var(--v2-text-disabled,#B8B6AE)]"
          />
          <kbd className="rounded border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)] px-[6px] py-[2px] text-[11px] text-[var(--v2-text-tertiary,#807E76)]">
            esc
          </kbd>
        </div>

        {/* ── Lista de resultados ───────────────────────────────────────── */}
        <Command.List className="max-h-[440px] overflow-y-auto p-[6px_0]">
          <Command.Empty className="px-4 py-8 text-center text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
            No se encontró nada. Intente otro término.
          </Command.Empty>

          {!isSearching ? (
            // ── Estado inicial: grupos por defecto ──────────────────────
            <>
              {/* Atajos de teclado disponibles */}
              <CmdGroup icon={<Keyboard size={13} />} heading="Atajos disponibles">
                <CmdItem
                  value="shortcut-cmdk"
                  icon={<Keyboard size={13} />}
                  title="Abrir command palette"
                  kbd="⌘K"
                  onSelect={() => { /* ya estamos aquí */ }}
                />
                <CmdItem
                  value="shortcut-new-case"
                  icon={<Folder size={13} />}
                  title="Nuevo caso"
                  kbd="⌘N"
                  onSelect={handleNewCase}
                />
                <CmdItem
                  value="shortcut-dictado"
                  icon={<Terminal size={13} />}
                  title="Nuevo dictado"
                  kbd="⌘D"
                  onSelect={handleDictado}
                />
                <CmdItem
                  value="shortcut-canvas"
                  icon={<FileText size={13} />}
                  title="Live canvas"
                  kbd="⌘L"
                  onSelect={handleCanvas}
                />
                <CmdItem
                  value="shortcut-sidebar"
                  icon={<Terminal size={13} />}
                  title="Toggle barra lateral"
                  kbd="⌘B"
                  onSelect={() => { close(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true })); }}
                />
                <CmdItem
                  value="shortcut-help"
                  icon={<Keyboard size={13} />}
                  title="Mostrar todos los atajos"
                  kbd="⌘?"
                  onSelect={() => { close(); toast.info('Atajos: ⌘K palette · ⌘N caso · ⌘D dictado · ⌘L canvas · ⌘B sidebar'); }}
                />
              </CmdGroup>

              {/* Skills disponibles */}
              {skills.length > 0 && (
                <CmdGroup icon={<Sparkles size={13} />} heading="Skills">
                  {skills.slice(0, 8).map((skill) => (
                    <CmdItem
                      key={skill.id}
                      value={`skill-${skill.id}`}
                      icon={<Sparkles size={13} />}
                      title={skill.name}
                      sub={skill.description}
                      prefix="/"
                      onSelect={() => handleSkillSelect(skill)}
                    />
                  ))}
                </CmdGroup>
              )}

              {/* Comandos rápidos */}
              <CmdGroup icon={<Terminal size={13} />} heading="Comandos">
                <CmdItem
                  value="cmd-nuevo-caso"
                  icon={<Folder size={13} />}
                  title="Nuevo caso"
                  sub="Registrar un nuevo expediente"
                  kbd="⌘N"
                  onSelect={handleNewCase}
                />
                <CmdItem
                  value="cmd-dictado"
                  icon={<Terminal size={13} />}
                  title="Nuevo dictado"
                  sub="Activa el agente de voz"
                  kbd="⌘D"
                  onSelect={handleDictado}
                />
                <CmdItem
                  value="cmd-canvas"
                  icon={<FileText size={13} />}
                  title="Live Canvas"
                  sub="Abrir editor de documentos"
                  kbd="⌘L"
                  onSelect={handleCanvas}
                />
                <CmdItem
                  value="cmd-calendario"
                  icon={<Calendar size={13} />}
                  title="Calendario y plazos"
                  sub="Ver audiencias y vencimientos"
                  onSelect={() => go('/calendario')}
                />
              </CmdGroup>

              {/* Voice tools */}
              <CmdGroup icon={<Terminal size={13} />} heading="Voice tools disponibles">
                {VOICE_TOOLS_STUB.map((t) => (
                  <CmdItem
                    key={t.name}
                    value={`vt-${t.name}`}
                    icon={<Terminal size={13} />}
                    title={t.name}
                    sub={t.description}
                    onSelect={() => {
                      close();
                      window.dispatchEvent(new CustomEvent('v2:voice-tool', { detail: { name: t.name } }));
                      toast.info(`Tool: ${t.name}`);
                    }}
                  />
                ))}
              </CmdGroup>

              {/* Plazos próximos 7 días */}
              {deadlines.length > 0 && (
                <CmdGroup icon={<Calendar size={13} />} heading="Plazos próximos (7 días)">
                  {deadlines.slice(0, 5).map((d) => (
                    <CmdItem
                      key={d.id}
                      value={`dl-${d.id}`}
                      icon={<Calendar size={13} />}
                      title={d.titulo}
                      sub={new Date(d.fecha).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}
                      onSelect={() => go(`/casos/${d.matter_id}`)}
                    />
                  ))}
                </CmdGroup>
              )}
            </>
          ) : (
            // ── Estado búsqueda activa ──────────────────────────────────
            <>
              {/* Casos (#) */}
              {results.matters.length > 0 && (
                <CmdGroup icon={<Folder size={13} />} heading={`Casos (${results.matters.length})`}>
                  {results.matters.slice(0, 10).map((m) => (
                    <CmdItem
                      key={m.id}
                      value={`matter-${m.id}`}
                      icon={<Folder size={13} />}
                      title={m.titulo}
                      sub={`${m.materia} · ${m.display_id}`}
                      prefix="#"
                      onSelect={() => go(`/casos/${m.id}`)}
                    />
                  ))}
                </CmdGroup>
              )}

              {/* Partes (@) */}
              {results.clients.length > 0 && (
                <CmdGroup icon={<User size={13} />} heading={`Partes (${results.clients.length})`}>
                  {results.clients.slice(0, 10).map((c) => (
                    <CmdItem
                      key={c.id}
                      value={`client-${c.id}`}
                      icon={<User size={13} />}
                      title={c.nombre}
                      sub={c.tax_id ?? ''}
                      prefix="@"
                      onSelect={() => go(`/clientes/${c.id}`)}
                    />
                  ))}
                </CmdGroup>
              )}

              {/* Documentos */}
              {results.documents.length > 0 && (
                <CmdGroup icon={<FileText size={13} />} heading={`Documentos (${results.documents.length})`}>
                  {results.documents.slice(0, 10).map((d) => (
                    <CmdItem
                      key={d.id}
                      value={`doc-${d.id}`}
                      icon={<FileText size={13} />}
                      title={d.titulo}
                      sub={d.kind}
                      onSelect={() => go(`/casos/${d.matter_id}`)}
                    />
                  ))}
                </CmdGroup>
              )}

              {/* Jurisprudencia (≥3 chars) */}
              {isLongQuery && results.sentencias.length > 0 && (
                <CmdGroup icon={<BookOpen size={13} />} heading={`Jurisprudencia (${results.sentencias.length})`}>
                  {results.sentencias.slice(0, 10).map((s) => (
                    <CmdItem
                      key={s.id}
                      value={`sent-${s.id}`}
                      icon={<BookOpen size={13} />}
                      title={s.numero}
                      sub={(s.rubro ?? '').slice(0, 80)}
                      onSelect={() => go('/buscar')}
                    />
                  ))}
                </CmdGroup>
              )}

              {/* Normativa (≥3 chars) — TODO: conectar /api/norms/search cuando exista */}
              {isLongQuery && (
                <CmdGroup icon={<Gavel size={13} />} heading="Normativa">
                  <CmdItem
                    value="norm-search"
                    icon={<Gavel size={13} />}
                    title={`Buscar normativa: "${query}"`}
                    sub="Búsqueda en base normativa LexAI"
                    onSelect={() => { close(); go(`/buscar?q=${encodeURIComponent(query)}&tipo=norma`); }}
                  />
                </CmdGroup>
              )}

              {/* Skills filtradas */}
              {skills.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())).length > 0 && (
                <CmdGroup icon={<Sparkles size={13} />} heading="Skills">
                  {skills
                    .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 5)
                    .map((skill) => (
                      <CmdItem
                        key={skill.id}
                        value={`skill-search-${skill.id}`}
                        icon={<Sparkles size={13} />}
                        title={skill.name}
                        sub={skill.description}
                        prefix="/"
                        onSelect={() => handleSkillSelect(skill)}
                      />
                    ))}
                </CmdGroup>
              )}
            </>
          )}
        </Command.List>

        {/* ── Footer con atajos ──────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--v2-border-subtle,#E8E7E1)] bg-[var(--v2-bg-subtle,#F2F1EC)] px-[16px] py-[8px] text-[11px] text-[var(--v2-text-tertiary,#6E6C64)]"
          aria-label="Atajos del teclado"
        >
          <ShortcutHint keys="⌘N" label="Nuevo caso" />
          <ShortcutHint keys="⌘D" label="Dictado" />
          <ShortcutHint keys="⌘L" label="Canvas" />
          <ShortcutHint keys="⌘B" label="Sidebar" />
          <ShortcutHint keys="↵" label="Ejecutar" />
          <ShortcutHint keys="↑↓" label="Navegar" />
          <ShortcutHint keys="ESC" label="Cerrar" />
        </div>
      </Command>
    </Command.Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-componentes internos
// ────────────────────────────────────────────────────────────────────────────

function CmdGroup({
  heading,
  icon,
  children,
}: {
  heading: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-[6px] [&_[cmdk-group-heading]]:px-[18px] [&_[cmdk-group-heading]]:pt-[10px] [&_[cmdk-group-heading]]:pb-[4px] [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--v2-text-tertiary,#807E76)]"
    >
      {children}
    </Command.Group>
  );
}

function CmdItem({
  value,
  icon,
  title,
  sub,
  prefix,
  kbd,
  onSelect,
}: {
  value: string;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  prefix?: string;
  kbd?: string;
  onSelect?: () => void;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 px-[18px] py-[9px] text-[var(--v2-text-primary,#1A1916)] data-[selected=true]:bg-[var(--v2-brand-navy-soft,#E8EDF7)]"
    >
      <span className="text-[var(--v2-text-tertiary,#807E76)]">{icon}</span>
      {prefix && (
        <span className="font-mono text-[12px] text-[var(--v2-accent-copper,#B8763C)]">{prefix}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium">{title}</div>
        {sub && (
          <div className="line-clamp-1 text-[11.5px] text-[var(--v2-text-tertiary,#807E76)]">{sub}</div>
        )}
      </div>
      {kbd && (
        <kbd className="ml-auto rounded border border-[var(--v2-border-default,#D4D2CA)] bg-[var(--v2-bg-subtle,#F2F1EC)] px-[6px] py-[2px] text-[10.5px] text-[var(--v2-text-tertiary,#807E76)]">
          {kbd}
        </kbd>
      )}
    </Command.Item>
  );
}

function ShortcutHint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="rounded border border-[var(--v2-border-default,#D4D2CA)] bg-white px-[5px] py-[1px] text-[10px] font-medium">
        {keys}
      </kbd>
      <span>{label}</span>
    </span>
  );
}
