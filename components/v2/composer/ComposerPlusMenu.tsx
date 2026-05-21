'use client';

/**
 * F3-T02 · LexAI UX v2 — ComposerPlusMenu
 *
 * Popover accesible con 10 opciones del menú "+":
 *   1. Subir documento      — abre file picker
 *   2. Adjuntar caso        — sub-panel con búsqueda de matters
 *   3. Adjuntar parte       — sub-panel con búsqueda de clientes/contrapartes
 *   4. Adjuntar juez        — sub-panel con búsqueda de jueces
 *   5. Adjuntar plazo       — sub-panel plazos próximos 14 días
 *   ── separador ──
 *   6. Skills               — sub-panel con /ask, /lex, /redactar/*, /revisar/*
 *   7. Búsqueda jurisprudencia — toggle activa flag en payload
 *   ── separador ──
 *   8. Conectores           — sub-panel DIAN/Rama Judicial/IGAC/SICAAC
 *   9. Modo dictado         — toggle voice mode
 *  10. Usar plantilla       — sub-panel tutela/contrato/petición → inserta en prompt
 *
 * Flag: NEXT_PUBLIC_UX_V2_COMPOSER
 */

import { useRef, useState } from 'react';
import {
  Plus,
  Upload,
  Folder,
  User,
  Scale,
  Calendar,
  Sparkles,
  BookOpen,
  Plug,
  Mic,
  FileText,
  ChevronRight,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import type { Attachment, AttachmentType } from './AttachmentChip';

// ─── Stub data (TODO: reemplazar con hooks reales de matters/judges/deadlines) ─
const STUB_MATTERS = [
  { id: 'm1', label: 'Pérez vs López Financiera' },
  { id: 'm2', label: 'DDA vs Banco X' },
  { id: 'm3', label: 'García Hermanos S.A.S.' },
  { id: 'm4', label: 'Romero Constructora Ltda.' },
  { id: 'm5', label: 'Fundación Arte Bogotá' },
];
const STUB_PARTIES = [
  { id: 'p1', label: 'Juan García (demandante)' },
  { id: 'p2', label: 'Banco X S.A. (demandado)' },
  { id: 'p3', label: 'Diana Díaz Ardila (peticionaria)' },
  { id: 'p4', label: 'Pérez López (apoderado)' },
  { id: 'p5', label: 'Constructora La Española (tercero)' },
];
const STUB_JUDGES = [
  { id: 'j1', label: 'Dr. Hernández Pérez · Juz. 3° Civil' },
  { id: 'j2', label: 'Dra. Martínez Torres · Juz. Laboral 1°' },
  { id: 'j3', label: 'Dr. Rodríguez Castro · Juz. Adm. 2°' },
  { id: 'j4', label: 'Dra. Vargas Moreno · Trib. Superior Civil' },
  { id: 'j5', label: 'Dr. Sánchez Rueda · Consejo de Estado' },
];
const STUB_DEADLINES = [
  { id: 'd1', label: 'Traslado demanda · mañana 5pm' },
  { id: 'd2', label: 'Memorial alegatos · 23 may' },
  { id: 'd3', label: 'Prescripción Art. 488 CST · 25 may' },
  { id: 'd4', label: 'Audiencia inicial · 28 may' },
  { id: 'd5', label: 'Respuesta requerimiento DIAN · 30 may' },
];
const STUB_SKILLS = [
  { slug: '/ask',              label: '/ask — Pregunta general' },
  { slug: '/lex',              label: '/lex — Análisis legal' },
  { slug: '/redactar/tutela',  label: '/redactar/tutela' },
  { slug: '/redactar/demanda', label: '/redactar/demanda' },
  { slug: '/redactar/memorial',label: '/redactar/memorial' },
  { slug: '/revisar/contrato', label: '/revisar/contrato' },
  { slug: '/revisar/clausulas',label: '/revisar/clausulas' },
  { slug: '/calcular/liquidacion', label: '/calcular/liquidacion' },
  { slug: '/calcular/terminos',    label: '/calcular/terminos' },
];
const STUB_CONNECTORS = [
  { slug: 'dian',         label: 'DIAN — Dirección de Impuestos' },
  { slug: 'rama_judicial',label: 'Rama Judicial — Consulta procesos' },
  { slug: 'igac',         label: 'IGAC — Datos prediales' },
  { slug: 'sicaac',       label: 'SICAAC — Conceptos técnicos' },
];
const STUB_TEMPLATES = [
  { slug: 'tutela',    label: 'Tutela (Art. 86 CP)',          text: '[PLANTILLA TUTELA]\n\nSEÑOR(A) JUEZ:\n\nActuando en mi propio nombre y derecho, presento acción de tutela contra ...\n\n' },
  { slug: 'contrato',  label: 'Contrato de servicios',        text: '[PLANTILLA CONTRATO DE SERVICIOS]\n\nEntre las partes: ...\n\n' },
  { slug: 'peticion',  label: 'Derecho de petición (CPCA)',   text: '[PLANTILLA DERECHO DE PETICIÓN]\n\nCon fundamento en el artículo 23 de la Constitución Política y la Ley 1437 de 2011 ...\n\n' },
];

// ─── Sub-panel de búsqueda genérico ──────────────────────────────────────────

type SubItem = { id: string; label: string };

function SearchSubPanel({
  title,
  items,
  onSelect,
  onBack,
}: {
  title: string;
  items: SubItem[];
  onSelect: (item: SubItem) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver al menú principal"
          className="flex h-6 w-6 items-center justify-center rounded text-[color:var(--v2-text-tertiary,#7A7870)] hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="text-[12px] font-semibold text-[color:var(--v2-text-primary,#1A1916)]">
          {title}
        </span>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar..."
        autoFocus
        className={[
          'w-full rounded-lg border border-[color:var(--v2-border-subtle,#E8E6DF)]',
          'px-2.5 py-1.5 text-[12px]',
          'bg-[color:var(--v2-bg-base,#FAFAF7)] text-[color:var(--v2-text-primary,#1A1916)]',
          'placeholder:text-[color:var(--v2-text-tertiary,#7A7870)]',
          'focus:outline-none focus:ring-2 focus:ring-[color:var(--v2-accent-copper,#B8763C)]/40',
        ].join(' ')}
      />
      <div className="mt-1 max-h-[180px] overflow-y-auto flex flex-col gap-0.5">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-[12px] text-[color:var(--v2-text-tertiary,#7A7870)]">
            Sin resultados
          </p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={[
                'flex w-full items-center rounded-lg px-2.5 py-1.5 text-left',
                'text-[12px] text-[color:var(--v2-text-primary,#1A1916)]',
                'hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1',
                'transition-colors duration-100',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  onClick,
  hasSubMenu,
  active,
  description,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  hasSubMenu?: boolean;
  active?: boolean;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2',
        'text-left transition-colors duration-100',
        active
          ? 'bg-[color:var(--v2-accent-copper-soft,#F5EBE0)] text-[color:var(--v2-accent-copper,#B8763C)]'
          : 'text-[color:var(--v2-text-primary,#1A1916)] hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium leading-tight">{label}</span>
        {description && (
          <span className="block text-[11px] text-[color:var(--v2-text-tertiary,#7A7870)] leading-tight">
            {description}
          </span>
        )}
      </span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {hasSubMenu && !active && (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
      )}
    </button>
  );
}

function Separator() {
  return (
    <div
      role="separator"
      className="my-1 h-px bg-[color:var(--v2-border-subtle,#E8E6DF)]"
      aria-hidden
    />
  );
}

// ─── Tipos de sub-panel ───────────────────────────────────────────────────────

type SubPanel =
  | 'matter'
  | 'party'
  | 'judge'
  | 'deadline'
  | 'skills'
  | 'connectors'
  | 'templates'
  | null;

// ─── Props del componente ──────────────────────────────────────────────────────

export interface ComposerPlusMenuProps {
  onAttachDocument: (file: File) => void;
  onAttachMatter: (attachment: Attachment) => void;
  onAttachParty: (attachment: Attachment) => void;
  onAttachJudge: (attachment: Attachment) => void;
  onAttachDeadline: (attachment: Attachment) => void;
  onSelectSkill: (slug: string) => void;
  onToggleJurisprudencia: () => void;
  jurisprudenciaActive: boolean;
  onSelectConnector: (slug: string) => void;
  onToggleVoice: () => void;
  onInsertTemplate: (text: string) => void;
  disabled?: boolean;
}

export function ComposerPlusMenu({
  onAttachDocument,
  onAttachMatter,
  onAttachParty,
  onAttachJudge,
  onAttachDeadline,
  onSelectSkill,
  onToggleJurisprudencia,
  jurisprudenciaActive,
  onSelectConnector,
  onToggleVoice,
  onInsertTemplate,
  disabled,
}: ComposerPlusMenuProps) {
  const [open, setOpen] = useState(false);
  const [subPanel, setSubPanel] = useState<SubPanel>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = () => {
    setOpen(false);
    setSubPanel(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAttachDocument(file);
      closeMenu();
    }
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleAttachMatter = (item: SubItem) => {
    onAttachMatter({ id: `att-matter-${item.id}`, type: 'matter', label: item.label, entityId: item.id });
    closeMenu();
  };
  const handleAttachParty = (item: SubItem) => {
    onAttachParty({ id: `att-party-${item.id}`, type: 'party', label: item.label, entityId: item.id });
    closeMenu();
  };
  const handleAttachJudge = (item: SubItem) => {
    onAttachJudge({ id: `att-judge-${item.id}`, type: 'judge', label: item.label, entityId: item.id });
    closeMenu();
  };
  const handleAttachDeadline = (item: SubItem) => {
    onAttachDeadline({ id: `att-deadline-${item.id}`, type: 'deadline', label: item.label, entityId: item.id });
    closeMenu();
  };
  const handleSelectSkill = (item: SubItem) => {
    onSelectSkill(item.id); // item.id is the slug
    closeMenu();
  };
  const handleSelectConnector = (item: SubItem) => {
    onSelectConnector(item.id);
    closeMenu();
  };
  const handleSelectTemplate = (item: SubItem & { text?: string }) => {
    const template = STUB_TEMPLATES.find((t) => t.slug === item.id);
    if (template) onInsertTemplate(template.text);
    closeMenu();
  };

  return (
    <>
      {/* Hidden file input for document upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
        tabIndex={-1}
      />

      <Popover.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubPanel(null); }}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Adjuntar o agregar contenido"
            aria-expanded={open}
            className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              'text-[color:var(--v2-text-secondary,#4A4944)]',
              'hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)] hover:text-[color:var(--v2-text-primary,#1A1916)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]',
              'disabled:cursor-not-allowed disabled:opacity-40',
              open ? 'bg-[color:var(--v2-bg-subtle,#F2F1EC)] rotate-45' : '',
              'transition-all duration-150',
            ].join(' ')}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            side="top"
            align="start"
            sideOffset={8}
            className={[
              'z-[200] w-[260px] rounded-xl p-1.5',
              'bg-white shadow-xl border border-[color:var(--v2-border-subtle,#E8E6DF)]',
              'animate-in fade-in-0 zoom-in-95',
            ].join(' ')}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {/* ─── Sub-panel de búsqueda ─── */}
            {subPanel === 'matter' && (
              <SearchSubPanel
                title="Adjuntar caso"
                items={STUB_MATTERS}
                onSelect={handleAttachMatter}
                onBack={() => setSubPanel(null)}
              />
            )}
            {subPanel === 'party' && (
              <SearchSubPanel
                title="Adjuntar parte"
                items={STUB_PARTIES}
                onSelect={handleAttachParty}
                onBack={() => setSubPanel(null)}
              />
            )}
            {subPanel === 'judge' && (
              <SearchSubPanel
                title="Adjuntar juez"
                items={STUB_JUDGES}
                onSelect={handleAttachJudge}
                onBack={() => setSubPanel(null)}
              />
            )}
            {subPanel === 'deadline' && (
              <SearchSubPanel
                title="Adjuntar plazo"
                items={STUB_DEADLINES}
                onSelect={handleAttachDeadline}
                onBack={() => setSubPanel(null)}
              />
            )}
            {subPanel === 'skills' && (
              <SearchSubPanel
                title="Seleccionar skill"
                items={STUB_SKILLS.map((s) => ({ id: s.slug, label: s.label }))}
                onSelect={handleSelectSkill}
                onBack={() => setSubPanel(null)}
              />
            )}
            {subPanel === 'connectors' && (
              <SearchSubPanel
                title="Seleccionar conector"
                items={STUB_CONNECTORS.map((c) => ({ id: c.slug, label: c.label }))}
                onSelect={handleSelectConnector}
                onBack={() => setSubPanel(null)}
              />
            )}
            {subPanel === 'templates' && (
              <SearchSubPanel
                title="Usar plantilla"
                items={STUB_TEMPLATES.map((t) => ({ id: t.slug, label: t.label }))}
                onSelect={handleSelectTemplate}
                onBack={() => setSubPanel(null)}
              />
            )}

            {/* ─── Menú principal ─── */}
            {!subPanel && (
              <>
                {/* 1. Subir documento */}
                <MenuItem
                  icon={Upload}
                  label="Subir documento"
                  description="PDF, Word o imagen"
                  onClick={() => { fileInputRef.current?.click(); closeMenu(); }}
                />
                {/* 2. Adjuntar caso */}
                <MenuItem
                  icon={Folder}
                  label="Adjuntar caso"
                  hasSubMenu
                  onClick={() => setSubPanel('matter')}
                />
                {/* 3. Adjuntar parte */}
                <MenuItem
                  icon={User}
                  label="Adjuntar parte"
                  hasSubMenu
                  onClick={() => setSubPanel('party')}
                />
                {/* 4. Adjuntar juez */}
                <MenuItem
                  icon={Scale}
                  label="Adjuntar juez"
                  hasSubMenu
                  onClick={() => setSubPanel('judge')}
                />
                {/* 5. Adjuntar plazo */}
                <MenuItem
                  icon={Calendar}
                  label="Adjuntar plazo"
                  description="Próximos 14 días"
                  hasSubMenu
                  onClick={() => setSubPanel('deadline')}
                />

                <Separator />

                {/* 6. Skills */}
                <MenuItem
                  icon={Sparkles}
                  label="Skills"
                  description="/ask, /lex, /redactar, /revisar..."
                  hasSubMenu
                  onClick={() => setSubPanel('skills')}
                />
                {/* 7. Búsqueda jurisprudencia (toggle) */}
                <MenuItem
                  icon={BookOpen}
                  label="Búsqueda jurisprudencia"
                  description={jurisprudenciaActive ? 'Activa — se buscará en la consulta' : 'Incluye sentencias y doctrina'}
                  active={jurisprudenciaActive}
                  onClick={() => { onToggleJurisprudencia(); closeMenu(); }}
                />

                <Separator />

                {/* 8. Conectores */}
                <MenuItem
                  icon={Plug}
                  label="Conectores"
                  description="DIAN, Rama Judicial, IGAC..."
                  hasSubMenu
                  onClick={() => setSubPanel('connectors')}
                />
                {/* 9. Modo dictado */}
                <MenuItem
                  icon={Mic}
                  label="Modo dictado"
                  description="Activa voz para dictar"
                  onClick={() => { onToggleVoice(); closeMenu(); }}
                />
                {/* 10. Usar plantilla */}
                <MenuItem
                  icon={FileText}
                  label="Usar plantilla"
                  description="Tutela, contrato, petición..."
                  hasSubMenu
                  onClick={() => setSubPanel('templates')}
                />
              </>
            )}

            <Popover.Arrow className="fill-white drop-shadow-sm" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
