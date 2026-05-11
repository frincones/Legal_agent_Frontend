'use client';

/**
 * HTML → .docx converter for the TipTap canvas.
 *
 * Walks the HTML produced by the editor and emits a Word document with
 * Colombian legal styling (Times New Roman 12, 2.5 cm margins, justified
 * paragraphs, header + footer with paginación and disclaimer).
 *
 * Why a generic HTML → docx converter (instead of the PleadingDoc
 * structured generator in template-builder.ts):
 *   - Canvas can hold any kind of document (drafts, dictámenes, memos).
 *   - We preserve fidelity of headings, lists, tables, basic marks.
 *   - Structured generator stays available for the formal export
 *     wizard (Sprint 4 court-specific styles).
 */

import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  ExternalHyperlink,
  type IRunOptions,
} from 'docx';

const DEFAULT_FONT = 'Times New Roman';
const DEFAULT_FONT_SIZE = 24; // half-points → 12pt
const SMALL_SIZE = 18; // 9pt for footer/header

/** Sprint 4 · S4-04 · per-court typographic profile.
 * Margins are in twips (1440 = 1 inch). 1417 ≈ 2.5 cm. */
const COURT_STYLES: Record<
  string,
  { font: string; size: number; margin: number }
> = {
  // Default · CO TNR 12 · 2.5 cm
  default_co: { font: 'Times New Roman', size: 24, margin: 1417 },
  juzgado_civil_circuito: { font: 'Times New Roman', size: 24, margin: 1417 },
  juzgado_civil_municipal: { font: 'Times New Roman', size: 24, margin: 1417 },
  juzgado_laboral_circuito: { font: 'Times New Roman', size: 24, margin: 1417 },
  juzgado_familia: { font: 'Times New Roman', size: 24, margin: 1417 },
  juzgado_administrativo: { font: 'Arial', size: 22, margin: 1417 }, // Arial 11pt
  tribunal_superior: { font: 'Times New Roman', size: 24, margin: 1417 },
  // Cortes · márgenes más amplios y tipografía algo mayor (estética formal)
  corte_constitucional: { font: 'Arial', size: 22, margin: 1700 }, // ~3 cm
  corte_suprema: { font: 'Times New Roman', size: 24, margin: 1700 },
  consejo_estado: { font: 'Times New Roman', size: 24, margin: 1700 },
};

let FONT = DEFAULT_FONT;
let FONT_SIZE = DEFAULT_FONT_SIZE;

type RunMarks = {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  strike?: boolean;
};

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

export type ExportOptions = {
  /** Document title shown at the very top + Word metadata. */
  title?: string;
  /** Subtitle line under the title (e.g. juzgado / expediente / partes). */
  subtitle?: string;
  /** Lawyer name + tarjeta profesional for the disclaimer footer. */
  abogado?: { nombre: string; tarjetaProfesional: string };
  /** Filename suggestion (without extension). */
  filename?: string;
  /** Sprint 4 · S4-04 · target court key from COURT_STYLES.
   *  Falls back to default_co if unknown. */
  targetCourt?: string;
};

export const AVAILABLE_COURT_PROFILES = Object.keys(COURT_STYLES);

export type ExportResult = {
  blob: Blob;
  filename: string;
};

// ────────────────────────────────────────────────────────────────────
// HTML walker
// ────────────────────────────────────────────────────────────────────

function emitRuns(node: Node, marks: RunMarks): (TextRun | ExternalHyperlink)[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (!text) return [];
    return [
      new TextRun({
        text,
        font: FONT,
        size: FONT_SIZE,
        bold: marks.bold,
        italics: marks.italics,
        underline: marks.underline ? {} : undefined,
        strike: marks.strike,
      } as IRunOptions),
    ];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const childMarks: RunMarks = { ...marks };
  if (tag === 'b' || tag === 'strong') childMarks.bold = true;
  if (tag === 'i' || tag === 'em') childMarks.italics = true;
  if (tag === 'u') childMarks.underline = true;
  if (tag === 's' || tag === 'strike' || tag === 'del') childMarks.strike = true;
  if (tag === 'br') {
    return [new TextRun({ text: '', font: FONT, size: FONT_SIZE, break: 1 })];
  }

  // Hyperlinks: wrap children in ExternalHyperlink with underline + accent color.
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '';
    if (!href) {
      return Array.from(el.childNodes).flatMap((c) => emitRuns(c, childMarks));
    }
    const inner = Array.from(el.childNodes).flatMap((c) =>
      emitRuns(c, { ...childMarks, underline: true }),
    );
    // ExternalHyperlink only accepts TextRun children — flatten any nested links.
    const flat = inner.filter((r): r is TextRun => r instanceof TextRun);
    return [new ExternalHyperlink({ link: href, children: flat })];
  }

  return Array.from(el.childNodes).flatMap((c) => emitRuns(c, childMarks));
}

function paragraphFromBlock(
  el: HTMLElement,
  opts: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; align?: Align } = {},
): Paragraph {
  const runs = Array.from(el.childNodes).flatMap((c) => emitRuns(c, {}));
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    heading: opts.heading,
    children: runs.length > 0 ? runs : [new TextRun({ text: '', font: FONT, size: FONT_SIZE })],
  });
}

function blockFromList(el: HTMLElement, ordered: boolean, level = 0): Paragraph[] {
  const items: Paragraph[] = [];
  const itemEls = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li');
  for (const li of itemEls) {
    const liEl = li as HTMLElement;
    // Direct content of the li (excluding nested ul/ol).
    const ownChildren = Array.from(liEl.childNodes).filter((c) => {
      if (c.nodeType !== Node.ELEMENT_NODE) return true;
      const t = (c as HTMLElement).tagName.toLowerCase();
      return t !== 'ul' && t !== 'ol';
    });
    const runs = ownChildren.flatMap((c) => emitRuns(c, {}));
    items.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        numbering: ordered
          ? { reference: 'lex-numbered', level }
          : { reference: 'lex-bullets', level },
        children: runs.length > 0 ? runs : [new TextRun({ text: '', font: FONT, size: FONT_SIZE })],
      }),
    );
    // Recurse into nested lists.
    for (const nested of liEl.children) {
      const t = nested.tagName.toLowerCase();
      if (t === 'ul') items.push(...blockFromList(nested as HTMLElement, false, level + 1));
      else if (t === 'ol') items.push(...blockFromList(nested as HTMLElement, true, level + 1));
    }
  }
  return items;
}

function blockFromTable(el: HTMLElement): Table {
  const rows: TableRow[] = [];
  const tagRows = el.querySelectorAll('tr');
  tagRows.forEach((tr) => {
    const cells: TableCell[] = [];
    tr.querySelectorAll('td, th').forEach((cell) => {
      const isHeader = cell.tagName.toLowerCase() === 'th';
      const runs = Array.from(cell.childNodes).flatMap((c) =>
        emitRuns(c, { bold: isHeader }),
      );
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children:
                runs.length > 0
                  ? runs
                  : [new TextRun({ text: '', font: FONT, size: FONT_SIZE })],
            }),
          ],
        }),
      );
    });
    if (cells.length > 0) rows.push(new TableRow({ children: cells }));
  });
  return new Table({ rows });
}

function walkBlocks(root: HTMLElement): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [new TextRun({ text, font: FONT, size: FONT_SIZE })],
          }),
        );
      }
      continue;
    }
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case 'h1':
        out.push(paragraphFromBlock(el, { heading: HeadingLevel.HEADING_1, align: AlignmentType.CENTER }));
        break;
      case 'h2':
        out.push(paragraphFromBlock(el, { heading: HeadingLevel.HEADING_2 }));
        break;
      case 'h3':
        out.push(paragraphFromBlock(el, { heading: HeadingLevel.HEADING_3 }));
        break;
      case 'h4':
      case 'h5':
      case 'h6':
        out.push(paragraphFromBlock(el, { heading: HeadingLevel.HEADING_4 }));
        break;
      case 'p':
        out.push(paragraphFromBlock(el));
        break;
      case 'blockquote':
        // Indented italic paragraph.
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { left: 720 },
            children: Array.from(el.childNodes).flatMap((c) => emitRuns(c, { italics: true })),
          }),
        );
        break;
      case 'ul':
        out.push(...blockFromList(el, false));
        break;
      case 'ol':
        out.push(...blockFromList(el, true));
        break;
      case 'table':
        out.push(blockFromTable(el));
        // Empty paragraph after table to allow flow to continue.
        out.push(new Paragraph({ children: [new TextRun({ text: '', font: FONT, size: FONT_SIZE })] }));
        break;
      case 'hr':
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '———', font: FONT, size: FONT_SIZE })],
          }),
        );
        break;
      case 'div':
      case 'section':
      case 'article':
        // Recurse for grouping containers.
        out.push(...walkBlocks(el));
        break;
      default:
        // Unknown block: render its children inline as a paragraph.
        out.push(paragraphFromBlock(el));
        break;
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────

export async function htmlToDocxBlob(html: string, opts: ExportOptions = {}): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('htmlToDocxBlob must run in the browser');
  }
  // Resolve court profile · falls back to default if unknown.
  const profile = COURT_STYLES[opts.targetCourt ?? 'default_co'] ?? COURT_STYLES.default_co!;
  FONT = profile.font;
  FONT_SIZE = profile.size;

  const doc = new DOMParser().parseFromString(`<root>${html}</root>`, 'text/html');
  const root = doc.querySelector('root');
  if (!root) {
    return Packer.toBlob(emptyDocument(opts));
  }

  const body: Array<Paragraph | Table> = [];

  if (opts.title) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: opts.title, font: FONT, size: 28, bold: true })],
      }),
    );
  }
  if (opts.subtitle) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: opts.subtitle, font: FONT, size: 22, italics: true })],
      }),
    );
    body.push(new Paragraph({ children: [new TextRun({ text: '', font: FONT, size: FONT_SIZE })] }));
  }

  body.push(...walkBlocks(root as HTMLElement));

  const docx = new Document({
    creator: 'LexAI',
    title: opts.title ?? 'Documento',
    description: 'Documento generado en Live Canvas (LexAI) — revisión humana requerida.',
    styles: {
      default: {
        document: { run: { font: FONT, size: FONT_SIZE } },
        heading1: { run: { font: FONT, size: 28, bold: true } },
        heading2: { run: { font: FONT, size: 26, bold: true } },
        heading3: { run: { font: FONT, size: 24, bold: true } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'lex-numbered',
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2)', alignment: AlignmentType.START },
            { level: 2, format: LevelFormat.LOWER_ROMAN, text: '%3.', alignment: AlignmentType.START },
          ],
        },
        {
          reference: 'lex-bullets',
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START },
            { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.START },
            { level: 2, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.START },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: profile.margin,
              right: profile.margin,
              bottom: profile.margin,
              left: profile.margin,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text:
                      opts.abogado
                        ? `Documento generado con asistencia de IA (LexAI). Revisado por ${opts.abogado.nombre} — T.P. ${opts.abogado.tarjetaProfesional}. La revisión final es responsabilidad del abogado.`
                        : 'Documento generado con asistencia de IA (LexAI). La revisión final es responsabilidad del abogado.',
                    font: FONT,
                    size: SMALL_SIZE,
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
                    font: FONT,
                    size: SMALL_SIZE,
                  }),
                ],
              }),
            ],
          }),
        },
        children: body.length > 0
          ? body
          : [new Paragraph({ children: [new TextRun({ text: '(documento vacío)', font: FONT, size: FONT_SIZE })] })],
      },
    ],
  });

  return Packer.toBlob(docx);
}

function emptyDocument(opts: ExportOptions): Document {
  return new Document({
    creator: 'LexAI',
    title: opts.title ?? 'Documento',
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ children: [new TextRun({ text: '(documento vacío)', font: FONT, size: FONT_SIZE })] }),
        ],
      },
    ],
  });
}

export function suggestFilename(base: string | undefined): string {
  const today = new Date().toISOString().slice(0, 10);
  const safe = (base ?? 'documento')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 80);
  return `${safe || 'documento'}_${today}.docx`;
}

/**
 * Convenience: convert + trigger browser download.
 * Returns the suggested filename and the blob (so callers can do
 * additional work, e.g. uploading a copy to storage).
 */
export async function exportHtmlAsDocx(html: string, opts: ExportOptions = {}): Promise<ExportResult> {
  const blob = await htmlToDocxBlob(html, opts);
  const filename = opts.filename ?? suggestFilename(opts.title);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari/Edge can flush the download.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return { blob, filename };
}
