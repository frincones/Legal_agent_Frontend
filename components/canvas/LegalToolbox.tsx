'use client';

import { useCallback, useState } from 'react';
import { Scale, Quote, Type, BookOpen } from 'lucide-react';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';
import { cn } from '@/lib/utils';

/**
 * Legal Toolbox · rail derecho complementario al CitationsSidebar.
 *
 * Tres sub-paneles colapsables:
 *  1. Latinismos · pegada rápida con tooltip de definición.
 *  2. Fórmulas procesales · saludos de respeto, despedidas, fórmulas
 *     de petitorio, etc.
 *  3. Plantillas de cláusulas · más adelante (Sprint 4).
 *
 * Click en cualquier ítem inserta el texto en la posición del cursor
 * vía `uiCommandBus.getCanvasApi().insert_at_cursor(...)`.
 */

type Panel = 'latinismos' | 'formulas' | 'cláusulas';

const LATINISMOS: Array<{ term: string; def: string; example?: string }> = [
  { term: 'a quo', def: 'Tribunal o juez de instancia inferior (del que viene la apelación).', example: 'el juez a quo' },
  { term: 'ad quem', def: 'Tribunal o juez de instancia superior (al que sube la apelación).', example: 'el tribunal ad quem' },
  { term: 'in dubio pro reo', def: 'En la duda, a favor del reo. Principio penal.' },
  { term: 'in limine', def: 'Desde el inicio, sin entrar al fondo. Útil para excepciones de previo pronunciamiento.' },
  { term: 'iuris tantum', def: 'Presunción que admite prueba en contrario.' },
  { term: 'iure et de iure', def: 'Presunción que NO admite prueba en contrario.' },
  { term: 'mutatis mutandis', def: 'Cambiando lo que haya que cambiar. Aplicar por analogía.' },
  { term: 'prima facie', def: 'A primera vista, sin necesidad de mayor análisis.' },
  { term: 'sub iudice', def: 'En proceso de juzgamiento, aún sin sentencia.' },
  { term: 'ultra petita', def: 'Más allá de lo pedido. Vicio cuando el juez resuelve más de lo solicitado.' },
];

const FORMULAS: Array<{ label: string; text: string }> = [
  {
    label: 'Saludo · Honorable Juez',
    text: '\n**HONORABLE JUEZ:**\n\n',
  },
  {
    label: 'Saludo · Señor Juez',
    text: '\n**SEÑOR JUEZ:**\n\n',
  },
  {
    label: 'Saludo · Honorables Magistrados',
    text: '\n**HONORABLES MAGISTRADOS:**\n\n',
  },
  {
    label: 'Cierre formal · respetuosamente',
    text: '\n\nDe los señores Magistrados, atentamente,\n\n',
  },
  {
    label: 'Petitorio · sírvase',
    text: '\nPor lo expuesto, comedidamente solicito a su Despacho:\n\n1. ',
  },
  {
    label: 'Notificaciones · domicilio',
    text: '\n**NOTIFICACIONES.** Recibiré notificaciones en la dirección señalada al inicio del presente escrito y en el correo electrónico que aparece en mi tarjeta profesional.\n\n',
  },
  {
    label: 'Pruebas · documentales',
    text: '\n**PRUEBAS.** Sírvase tener como pruebas los siguientes documentos:\n\n1. ',
  },
  {
    label: 'Anexos · listado',
    text: '\n**ANEXOS.**\n\n1. ',
  },
];

export function LegalToolbox() {
  const [open, setOpen] = useState<Panel>('latinismos');

  const insert = useCallback((text: string) => {
    const api = uiCommandBus.getCanvasApi();
    if (!api) return;
    api.insert_at_cursor(text);
  }, []);

  return (
    <aside className="surface flex h-full min-h-0 flex-col">
      <header className="border-b border-line px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider muted">
          Toolbox jurídico
        </div>
        <div className="mt-[2px] text-[11px] text-ink-3">
          Click para insertar en el cursor.
        </div>
      </header>
      <nav className="flex border-b border-line text-[12px]">
        {([
          ['latinismos','Latinismos', BookOpen],
          ['formulas','Fórmulas', Quote],
          ['cláusulas','Cláusulas', Scale],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setOpen(id as Panel)}
            className={cn(
              'flex-1 px-2 py-2 text-[11.5px] font-medium transition-colors',
              open === id ? 'border-b-2 border-accent text-ink' : 'border-b-2 border-transparent text-ink-3 hover:text-ink',
            )}
          >
            <Icon size={11} className="mr-1 inline align-text-top" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto p-3">
        {open === 'latinismos' && (
          <ul className="space-y-1">
            {LATINISMOS.map((l) => (
              <li key={l.term}>
                <button
                  type="button"
                  onClick={() => insert(`*${l.term}*`)}
                  title={l.def}
                  className="group flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-bg-sunken"
                >
                  <span className="serif italic">{l.term}</span>
                  <span className="line-clamp-1 flex-1 text-[11px] muted">{l.def}</span>
                  <Type size={11} className="flex-none text-ink-3 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {open === 'formulas' && (
          <ul className="space-y-1">
            {FORMULAS.map((f) => (
              <li key={f.label}>
                <button
                  type="button"
                  onClick={() => insert(f.text)}
                  title={f.text.trim().slice(0, 120)}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-bg-sunken"
                >
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {open === 'cláusulas' && (
          <div className="rounded-md border border-dashed border-line p-3 text-[11.5px] muted">
            Plantillas de cláusulas (contratos, contestaciones, alegatos) llegan en Sprint 4
            con la biblioteca de templates por juzgado.
          </div>
        )}
      </div>
    </aside>
  );
}
