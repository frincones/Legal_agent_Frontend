'use client';

import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import { ReactRenderer, type Editor as TiptapEditor } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sprint 3.E · Slash commands `/`
 *
 * Cuando el abogado escribe `/` aparece un popover con acciones rápidas:
 * - Insertar plantilla legal (tutela, demanda, contestación, etc.)
 * - Pedir al agente que redacte / cite / reformule
 * - Insertar bloques estructurales (tabla de pretensiones, hechos numerados,
 *   anexos, juramento estimatorio CGP 206, firma con T.P.)
 *
 * Usa @tiptap/suggestion (MIT) + tippy.js para el popover.
 */

export type SlashItem = {
  id: string;
  label: string;
  description: string;
  group: 'plantillas' | 'estructura' | 'agente';
  icon?: string;
  /** Si está, inserta este markdown en el cursor. */
  markdown?: string;
  /** Si está, llama al endpoint de transformación con esta acción. */
  transformAction?: 'improve' | 'formalize' | 'summarize' | 'cite' | 'draft';
  /** Si está, carga la plantilla por kind desde /api/legal-templates?kind=X. */
  templateKind?: string;
};

const STATIC_ITEMS: SlashItem[] = [
  // Estructura legal CO
  {
    id: 'hechos-numerados',
    label: 'Hechos numerados',
    description: 'Bloque "PRIMERO. ... SEGUNDO. ... TERCERO. ..."',
    group: 'estructura',
    icon: '📋',
    markdown: `## HECHOS\n\n**PRIMERO.** \n\n**SEGUNDO.** \n\n**TERCERO.** \n`,
  },
  {
    id: 'pretensiones',
    label: 'Pretensiones',
    description: 'Pretensiones principales y subsidiarias',
    group: 'estructura',
    icon: '⚖️',
    markdown: `## PRETENSIONES\n\n### Principales\n\n**Primera.** Sírvase su Despacho declarar que \n\n**Segunda.** Como consecuencia de lo anterior, condénese a la demandada a \n\n### Subsidiarias\n\n**Primera.** En subsidio de las anteriores, sírvase declarar que \n`,
  },
  {
    id: 'pruebas',
    label: 'Pruebas',
    description: 'Documentales, testimoniales, periciales',
    group: 'estructura',
    icon: '🔍',
    markdown: `## PRUEBAS\n\n### Documentales\n- \n\n### Testimoniales\n- \n\n### Periciales\n- \n`,
  },
  {
    id: 'juramento-cgp206',
    label: 'Juramento estimatorio (CGP Art. 206)',
    description: 'Bloque obligatorio si hay perjuicios económicos',
    group: 'estructura',
    icon: '✍️',
    markdown: `## JURAMENTO ESTIMATORIO\n\nDe conformidad con el artículo 206 del Código General del Proceso, bajo la gravedad del juramento estimo razonadamente la cuantía de los perjuicios cuya indemnización pretendo en la suma de **[VALOR EN PESOS]** ($[VALOR_NUMERICO]), discriminados así:\n\n- \n\nDe conformidad con el inciso 1° del artículo 206 ibídem, esta cuantía no excede el porcentaje establecido legalmente.\n`,
  },
  {
    id: 'anexos',
    label: 'Anexos',
    description: 'Listado numerado de anexos',
    group: 'estructura',
    icon: '📎',
    markdown: `## ANEXOS\n\n1. \n2. \n3. \n`,
  },
  {
    id: 'notificaciones',
    label: 'Notificaciones',
    description: 'Direcciones procesales del demandante y demandado',
    group: 'estructura',
    icon: '📬',
    markdown: `## NOTIFICACIONES\n\n**Del suscrito apoderado:**\n- Dirección: \n- Correo electrónico: \n- Teléfono: \n\n**De la parte demandada:**\n- Dirección: \n- Correo electrónico: \n`,
  },
  {
    id: 'firma-tp',
    label: 'Firma con T.P.',
    description: 'Bloque de firma + tarjeta profesional',
    group: 'estructura',
    icon: '🖊️',
    markdown: `\n\nDel señor Juez,\n\n___________________________\n**[NOMBRE COMPLETO DEL APODERADO]**\nC.C. No. [CÉDULA] de [CIUDAD]\nT.P. No. [NÚMERO TARJETA] del C.S. de la J.\n`,
  },
  // Agente — acciones IA
  {
    id: 'mejorar-seleccion',
    label: 'Mejorar redacción',
    description: 'Reescribe con tono más profesional (selecciona texto primero)',
    group: 'agente',
    icon: '✨',
    transformAction: 'improve',
  },
  {
    id: 'formalizar',
    label: 'Hacer más formal',
    description: 'Reformula con lenguaje jurídico técnico',
    group: 'agente',
    icon: '🎓',
    transformAction: 'formalize',
  },
  {
    id: 'resumir',
    label: 'Resumir párrafo',
    description: 'Condensa la selección en 1-2 oraciones',
    group: 'agente',
    icon: '📝',
    transformAction: 'summarize',
  },
  {
    id: 'citar-jurisprudencia',
    label: 'Citar jurisprudencia',
    description: 'Inserta sentencias colombianas relacionadas',
    group: 'agente',
    icon: '⚖️',
    transformAction: 'cite',
  },
];

type TemplateMeta = {
  kind: string;
  title: string;
  description: string;
  applicable: string;
};

async function loadDynamicItems(): Promise<SlashItem[]> {
  try {
    const res = await fetch('/api/legal-templates');
    if (!res.ok) return [];
    const data = (await res.json()) as { templates?: TemplateMeta[] };
    return (data.templates ?? []).map((t) => ({
      id: `tpl-${t.kind}`,
      label: t.title,
      description: t.description,
      group: 'plantillas' as const,
      icon: '📄',
      templateKind: t.kind,
    }));
  } catch {
    return [];
  }
}

export const SlashMenu = Extension.create({
  name: 'lexaiSlashMenu',
  addOptions() {
    return {
      onTransform: (_action: string, _editor: TiptapEditor) => {},
      onTemplate: (_kind: string, _editor: TiptapEditor) => {},
    };
  },
  addProseMirrorPlugins() {
    const opts = this.options as {
      onTransform: (action: string, editor: TiptapEditor) => void;
      onTemplate: (kind: string, editor: TiptapEditor) => void;
    };
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          // Combinar items estáticos con plantillas dinámicas (cargadas en mount).
          const all = [...STATIC_ITEMS, ...((this.editor.storage as Record<string, unknown>).slashTemplates as SlashItem[] ?? [])];
          if (!q) return all.slice(0, 12);
          return all
            .filter((it) => it.label.toLowerCase().includes(q) || it.description.toLowerCase().includes(q))
            .slice(0, 12);
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: TippyInstance[] = [];
          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(SlashMenuList, {
                props: { ...props, onTransform: opts.onTransform, onTemplate: opts.onTemplate },
                editor: props.editor,
              });
              if (!props.clientRect) return;
              popup = tippy('body', {
                getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'lexai',
                arrow: false,
                offset: [0, 8],
                maxWidth: 380,
              });
            },
            onUpdate: (props: SuggestionProps) => {
              component?.updateProps({ ...props, onTransform: opts.onTransform, onTemplate: opts.onTemplate });
              if (props.clientRect && popup[0]) {
                popup[0].setProps({ getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect() });
              }
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide();
                return true;
              }
              const ref = component?.ref as { onKeyDown?: (p: SuggestionKeyDownProps) => boolean } | null;
              return ref?.onKeyDown?.(props) ?? false;
            },
            onExit: () => {
              popup[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

type ListProps = SuggestionProps<SlashItem> & {
  onTransform: (action: string, editor: TiptapEditor) => void;
  onTemplate: (kind: string, editor: TiptapEditor) => void;
};

const SlashMenuList = forwardRef<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }, ListProps>(function SlashMenuList(props, ref) {
  const { items, command, editor, onTransform, onTemplate } = props;
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  const selectItem = (idx: number) => {
    const item = items[idx];
    if (!item) return;
    // Quitar el "/" + query antes de aplicar la acción.
    command({ id: item.id } as SlashItem);
    if (item.markdown) {
      editor.chain().focus().insertContent(parseMd(editor, item.markdown)).run();
    } else if (item.templateKind) {
      onTemplate(item.templateKind, editor);
    } else if (item.transformAction) {
      onTransform(item.transformAction, editor);
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((s) => (s - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selected);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-line bg-bg p-3 text-[12px] muted shadow-lg">
        Sin resultados.
      </div>
    );
  }

  // Group by group
  const grouped = items.reduce<Record<string, SlashItem[]>>((acc, it) => {
    (acc[it.group] ??= []).push(it);
    return acc;
  }, {});

  let runningIdx = 0;
  return (
    <div ref={listRef} className="w-[360px] overflow-hidden rounded-md border border-line bg-bg shadow-xl">
      {(Object.keys(grouped) as Array<keyof typeof grouped>).map((g) => (
        <div key={g}>
          <div className="border-b border-line bg-bg-sunken px-3 py-1 text-[10px] uppercase tracking-wide muted">
            {g === 'plantillas' ? 'Plantillas legales' : g === 'estructura' ? 'Bloques estructurales' : 'Acciones IA'}
          </div>
          {grouped[g]!.map((item) => {
            const idx = runningIdx++;
            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectItem(idx);
                }}
                onMouseEnter={() => setSelected(idx)}
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-left transition',
                  selected === idx ? 'bg-accent-soft' : 'hover:bg-bg-sunken',
                )}
              >
                <span className="text-[16px] leading-none mt-0.5">{item.icon ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">{item.label}</div>
                  <div className="text-[11px] muted line-clamp-2">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

// Helper para parsear markdown usando tiptap-markdown si está disponible.
function parseMd(editor: TiptapEditor, md: string): string {
  const storage = (editor.storage as Record<string, unknown>).markdown as
    | { parser?: { parse: (s: string) => string } }
    | undefined;
  return storage?.parser?.parse?.(md) ?? md;
}

// Cargar plantillas dinámicas en mount; el extension las consulta de storage.
SlashMenu.configure = SlashMenu.configure ?? (() => SlashMenu);

export async function preloadSlashTemplates(editor: TiptapEditor) {
  const items = await loadDynamicItems();
  (editor.storage as Record<string, unknown>).slashTemplates = items;
}
