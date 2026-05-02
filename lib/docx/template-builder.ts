/**
 * Generador de documentos .docx con estilos procesales colombianos.
 *
 * - Tipografía Times New Roman 12 (estándar memorial CO)
 * - Márgenes 2.5 cm
 * - Header con expediente y juzgado
 * - Footer con disclaimer LFPDPPP/UPL + SHA-256 hash
 * - Numeración de hojas
 *
 * Uso: pasa un PleadingDoc serializable (kind, header, sections, citations)
 * y devuelve un Blob listo para descargar.
 */

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
  LevelFormat,
} from 'docx';

export type PleadingHeader = {
  juzgado: string;
  expediente: string;
  titulo: string;
  partes: string;
};

export type PleadingSection = {
  heading: string;
  paragraphs: Array<string | { text: string; bold?: boolean; italic?: boolean }>;
};

export type PleadingCitation = {
  citation_ref: string;
  rubro: string;
  url_oficial?: string;
};

export type PleadingDoc = {
  kind:
    | 'demanda_ordinaria_laboral'
    | 'tutela'
    | 'contestacion'
    | 'recurso_apelacion'
    | 'recurso_casacion'
    | 'escrito'
    | 'carta_requerimiento'
    | 'contrato';
  header: PleadingHeader;
  sections: PleadingSection[];
  citations: PleadingCitation[];
  abogado: { nombre: string; tarjeta_profesional: string };
  sha256?: string;
};

const FONT = 'Times New Roman';

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];
type Heading = (typeof HeadingLevel)[keyof typeof HeadingLevel];

function p(text: string, opts: { bold?: boolean; italic?: boolean; align?: Align; heading?: Heading } = {}): Paragraph {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    heading: opts.heading,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 24, // 12pt
        bold: opts.bold,
        italics: opts.italic,
      }),
    ],
  });
}

export async function generatePleading(doc: PleadingDoc): Promise<Blob> {
  const headerSection = new Header({
    children: [
      p(`${doc.header.juzgado} · Exp. ${doc.header.expediente}`, {
        align: AlignmentType.CENTER,
      }),
    ],
  });

  const footerSection = new Footer({
    children: [
      p(
        `Documento generado con asistencia de IA (LexAI). Revisado por ${doc.abogado.nombre} — ${doc.abogado.tarjeta_profesional}. No constituye representación legal.`,
        { align: AlignmentType.CENTER },
      ),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
            font: FONT,
            size: 18,
          }),
          ...(doc.sha256
            ? [
                new TextRun({ text: '   ·   SHA-256: ', font: FONT, size: 16 }),
                new TextRun({ text: doc.sha256.slice(0, 16) + '…', font: 'JetBrains Mono', size: 16 }),
              ]
            : []),
        ],
      }),
    ],
  });

  // Body sections
  const body: Paragraph[] = [];
  body.push(p(doc.header.titulo, { bold: true, align: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }));
  body.push(p(doc.header.partes, { align: AlignmentType.CENTER }));
  body.push(p(''));

  for (const sec of doc.sections) {
    body.push(p(sec.heading, { bold: true, heading: HeadingLevel.HEADING_2 }));
    for (const para of sec.paragraphs) {
      if (typeof para === 'string') body.push(p(para));
      else body.push(p(para.text, { bold: para.bold, italic: para.italic }));
    }
    body.push(p(''));
  }

  if (doc.citations.length > 0) {
    body.push(p('Jurisprudencia citada', { bold: true, heading: HeadingLevel.HEADING_2 }));
    for (const c of doc.citations) {
      body.push(p(`· ${c.citation_ref} — ${c.rubro}${c.url_oficial ? ` (${c.url_oficial})` : ''}`));
    }
  }

  const docx = new Document({
    creator: 'LexAI',
    title: doc.header.titulo,
    description: 'Documento procesal generado con asistencia de IA',
    styles: {
      default: {
        document: { run: { font: FONT, size: 24 } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'numbered',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1417, right: 1417, bottom: 1417, left: 1417 }, // 2.5 cm
          },
        },
        headers: { default: headerSection },
        footers: { default: footerSection },
        children: body,
      },
    ],
  });

  return Packer.toBlob(docx);
}

/** SHA-256 of an arbitrary string (Web Crypto). */
export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
