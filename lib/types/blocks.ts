// Mirror del backend lex/blocks/schema.py
// Tipos generados manualmente para tener autocompletado en componentes UI

export type Alignment = "justify" | "left" | "right" | "center";

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

interface BaseBlock {
  block_id: string;
}

export interface TitleBlock extends BaseBlock {
  type: "title";
  text: string;
  level: 0 | 1 | 2;
}

export interface SectionHeadingBlock extends BaseBlock {
  type: "section_heading";
  roman: string;
  text: string;
  section_key: string;
}

export interface SubsectionBlock extends BaseBlock {
  type: "subsection";
  number: string;
  text: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  runs: Run[];
  align?: Alignment;
  indent_left_cm?: number | null;
}

export interface HechoBlock extends BaseBlock {
  type: "hecho";
  num: number;
  runs: Run[];
}

export interface PretensionBlock extends BaseBlock {
  type: "pretension";
  ord: string;
  runs: Run[];
  kind?: "declarativa" | "condena" | "general";
}

export interface NormaCitadaBlock extends BaseBlock {
  type: "norma_citada";
  norma: string;
  contenido?: Run[];
  verified?: boolean;
  derogada?: boolean;
  fuente_ref?: string | null;
}

export interface JurisprudenciaBlock extends BaseBlock {
  type: "jurisprudencia";
  id: string;
  mp: string;
  corte: string;
  fecha?: string | null;
  ratio?: Run[];
  chunk_id?: string | null;
  verified?: boolean;
  sim_score?: number | null;
}

export interface SilogismoBlock extends BaseBlock {
  type: "silogismo";
  premisa_mayor: Run[];
  premisa_menor: Run[];
  conclusion: Run[];
}

export interface TableBlock extends BaseBlock {
  type: "table";
  header: string[];
  rows: string[][];
  header_shading?: string | null;
  total_row_shading?: string | null;
  has_total_row?: boolean;
}

export interface CalcStepBlock extends BaseBlock {
  type: "calc_step";
  label: string;
  formula: string;
  aplicacion: string;
  total: string;
}

export interface ListItemBlock extends BaseBlock {
  type: "list_item";
  kind: "anexo" | "documental" | "testimonial" | "pericial" | "generic";
  num: string;
  runs: Run[];
}

export interface JuramentoBlock extends BaseBlock {
  type: "juramento";
  text: string;
  norma_ref?: string | null;
}

export interface FirmaBlock extends BaseBlock {
  type: "firma";
  ciudad_fecha: string;
  nombre: string;
  tp: string;
  cc?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export interface BlankBlock extends BaseBlock {
  type: "blank";
}

export type Block =
  | TitleBlock
  | SectionHeadingBlock
  | SubsectionBlock
  | ParagraphBlock
  | HechoBlock
  | PretensionBlock
  | NormaCitadaBlock
  | JurisprudenciaBlock
  | SilogismoBlock
  | TableBlock
  | CalcStepBlock
  | ListItemBlock
  | JuramentoBlock
  | FirmaBlock
  | BlankBlock;

export type BlockType = Block["type"];

// ============================================================
// SSE Events
// ============================================================

export type SSEEventName =
  | "meta"
  | "classification_started" | "classification_done"
  | "template_loaded"
  | "extraction_started" | "extraction_done"
  | "calculation_started" | "calculation_done"
  | "hunters_started" | "jurisprudence_query" | "hunters_done"
  | "derogation_started" | "derogation_check" | "derogation_done"
  | "section_started" | "block_emit" | "block_streaming" | "block_done" | "section_done"
  | "citation_verify_started" | "citation_verify" | "citation_verify_done"
  | "polish_started" | "polish_done"
  | "qa_started" | "qa_done"
  | "docx_built"
  | "audit_report"
  | "done"
  | "error"
  // M18.d: agent thought stream (Claude-style live narration)
  | "agent_thought";

// M18.d: Agent thought (narración en vivo del agente)
export type AgentThoughtKind =
  | "info"            // pensamiento genérico
  | "tool_call"       // invocando una herramienta
  | "tool_result"     // resultado de herramienta
  | "correction"      // sugerencia de corrección (Judge detectó cita incorrecta)
  | "warning"         // nota legal importante
  | "success"         // hito completado
  | "error";          // algo falló

export interface AgentThought {
  id: string;            // timestamp + random
  kind: AgentThoughtKind;
  message: string;
  tool?: string | null;
  ref?: string | null;
  url?: string | null;
  suggestion?: string | null;
  timestamp: number;
}

export interface SectionPlanItem {
  key: string;
  title: string;
  order: number;
  roman?: string | null;
}

export interface MetaPayload {
  generation_id: string;
  template_selected: { id: string; name: string; jurisdiccion?: string };
  sections_plan: SectionPlanItem[];
  estimated_seconds: number;
}

// ============================================================
// Timeline state
// ============================================================

export type StepStatus = "pending" | "in_progress" | "completed" | "error";

export interface TimelineStep {
  id: string;
  type:
    | "classification" | "extraction" | "calculation" | "hunters"
    | "derogation" | "section" | "polish" | "qa" | "docx" | "audit";
  title: string;
  status: StepStatus;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  details?: any;
}

export interface GenerationState {
  generationId: string | null;
  documentId: string | null;
  status: "idle" | "running" | "completed" | "error";
  startedAt: number | null;
  finishedAt: number | null;
  totalCostUsd: number;
  templateSelected: MetaPayload["template_selected"] | null;
  sectionsPlan: SectionPlanItem[];
  blocks: Block[];
  blocksByOrder: Map<string, Block>;
  timeline: TimelineStep[];
  audit: any | null;
  error: string | null;
  // M18.d: agent thought stream (live narration estilo Claude)
  thoughts: AgentThought[];
}
