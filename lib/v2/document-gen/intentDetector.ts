/**
 * lib/v2/document-gen/intentDetector.ts
 *
 * Detector de intent "generacion de documento" en input del usuario.
 * Heuristica simple por keywords + threshold. Si confianza < threshold,
 * el composer trata el mensaje como chat normal.
 *
 * Cuando el flag NEXT_PUBLIC_DOC_GEN_V2_ENABLED esta OFF, este modulo
 * NO se usa (el composer ignora la deteccion).
 *
 * Devuelve { isDocumentRequest, confidence, docType?, materia? }
 */

export type DocType =
  | 'tutela'
  | 'demanda'
  | 'contrato'
  | 'derecho_peticion'
  | 'denuncia'
  | 'recurso'
  | 'poder'
  | 'minuta'
  | 'memorial'
  | 'habeas_data'
  | 'conciliacion';

export type Materia =
  | 'constitucional'
  | 'civil'
  | 'comercial'
  | 'laboral'
  | 'penal'
  | 'administrativo'
  | 'familia'
  | 'tributario';

export interface IntentDetectionResult {
  isDocumentRequest: boolean;
  confidence: number;
  docType: DocType | null;
  materia: Materia | null;
  rawKeywords: string[];
}

const ACTION_VERBS = [
  'redacta', 'redactar', 'redactame', 'redactame',
  'elabora', 'elaborar', 'elaborame',
  'prepara', 'preparar', 'preparame',
  'escribe', 'escribir', 'escribeme',
  'genera', 'generar', 'generame',
  'crea', 'crear', 'creame',
  'arma', 'armar', 'armame',
  'haz', 'hacer', 'hazme',
  'dame', 'damelo', 'damela',
  'necesito', 'quiero',
];

const DOC_TYPE_KEYWORDS: Record<DocType, string[]> = {
  tutela: ['tutela', 'accion de tutela', 'amparo'],
  demanda: ['demanda', 'demandar', 'libelo', 'demanda ejecutiva', 'demanda ordinaria'],
  contrato: ['contrato', 'contratar', 'arrendamiento', 'compraventa', 'prestacion de servicios', 'prestacion servicios', 'mandato'],
  derecho_peticion: ['derecho de peticion', 'derecho peticion', 'peticion', 'pqr'],
  denuncia: ['denuncia', 'denuncia penal', 'denunciar'],
  recurso: ['recurso', 'recurso de reposicion', 'apelacion', 'casacion', 'queja'],
  poder: ['poder', 'poder especial', 'poder general', 'apoderado'],
  minuta: ['minuta', 'sas', 'srl', 'sociedad', 'estatutos'],
  memorial: ['memorial', 'escrito', 'alegatos'],
  habeas_data: ['habeas data', 'habeas-data', 'proteccion de datos'],
  conciliacion: ['conciliacion', 'acta de conciliacion', 'audiencia conciliacion'],
};

const MATERIA_KEYWORDS: Record<Materia, string[]> = {
  constitucional: ['constitucional', 'derecho fundamental', 'tutela'],
  civil: ['civil', 'responsabilidad civil', 'compraventa'],
  comercial: ['comercial', 'mercantil', 'sas', 'sociedad'],
  laboral: ['laboral', 'trabajo', 'despido', 'salario', 'cesantias', 'liquidacion'],
  penal: ['penal', 'denuncia', 'querella'],
  administrativo: ['administrativo', 'nulidad', 'restablecimiento'],
  familia: ['familia', 'alimentos', 'custodia', 'divorcio', 'menores'],
  tributario: ['tributario', 'dian', 'impuesto', 'iva', 'renta'],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .trim();
}

function detectKeywords(text: string, list: string[]): string[] {
  const norm = normalize(text);
  return list.filter((kw) => norm.includes(normalize(kw)));
}

export function detectDocumentIntent(input: string): IntentDetectionResult {
  if (!input || input.trim().length < 5) {
    return { isDocumentRequest: false, confidence: 0, docType: null, materia: null, rawKeywords: [] };
  }

  const text = normalize(input);

  // Skip si empieza con / (es un slash command, otro mecanismo)
  if (text.startsWith('/')) {
    return { isDocumentRequest: false, confidence: 0, docType: null, materia: null, rawKeywords: [] };
  }

  // 1. Detectar verbo de accion (necesario)
  const actionMatches = detectKeywords(text, ACTION_VERBS);
  if (actionMatches.length === 0) {
    return { isDocumentRequest: false, confidence: 0, docType: null, materia: null, rawKeywords: [] };
  }

  // 2. Detectar tipo de documento
  let detectedDocType: DocType | null = null;
  let docTypeKeywords: string[] = [];
  for (const [docType, keywords] of Object.entries(DOC_TYPE_KEYWORDS)) {
    const matches = detectKeywords(text, keywords);
    if (matches.length > 0) {
      detectedDocType = docType as DocType;
      docTypeKeywords = matches;
      break;
    }
  }

  if (!detectedDocType) {
    // Verbo + nada legal: muy probable chat normal
    return { isDocumentRequest: false, confidence: 0.2, docType: null, materia: null, rawKeywords: actionMatches };
  }

  // 3. Detectar materia
  let detectedMateria: Materia | null = null;
  for (const [materia, keywords] of Object.entries(MATERIA_KEYWORDS)) {
    const matches = detectKeywords(text, keywords);
    if (matches.length > 0) {
      detectedMateria = materia as Materia;
      break;
    }
  }

  // 4. Calcular confianza
  //    verbo accion + docType conocido => 0.85
  //    + materia detectada => +0.10
  //    + texto >40 chars (descripcion completa) => +0.05
  let confidence = 0.85;
  if (detectedMateria) confidence += 0.1;
  if (input.length > 40) confidence += 0.05;
  confidence = Math.min(confidence, 1.0);

  return {
    isDocumentRequest: true,
    confidence,
    docType: detectedDocType,
    materia: detectedMateria,
    rawKeywords: [...actionMatches, ...docTypeKeywords],
  };
}
