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

// M20.10/M20.13: 5-tier citation system (alineado con backend lex/tools/verify_citation.py)
export type CitationTier = "GROUNDED" | "VERIFY_FLAG" | "DEROGADA" | "NOT_FOUND" | "MODULADA";

export interface NormaCitadaBlock extends BaseBlock {
  type: "norma_citada";
  norma: string;
  contenido?: Run[];
  verified?: boolean;
  derogada?: boolean;
  fuente_ref?: string | null;
  // M19.10.A7: URLs canónicas verificadas (para hyperlinks en canvas y DOCX)
  fuente_url?: string | null;
  fuente_url_vigente?: string | null;
  fuente_url_oficial?: string | null;
  discovered_by?: string | null;
  titulo_oficial?: string | null;
  // M20.10: 4-tier markers
  tier?: CitationTier;
  derogada_por?: string | null;
  suggested_correction?: string | null;
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
  // M19.10.A3: URL canónica para hyperlink azul/underline en canvas y DOCX
  fuente_url?: string | null;
  fuente_url_oficial?: string | null;
  discovered_by?: string | null;
  // M20.10: 4-tier markers
  tier?: CitationTier;
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
  | "agent_thought"
  // M19.7: archivo final presentado con preview
  | "presented_file"
  // M19.20: Quality Loop Continuo
  | "completeness_check_done"
  | "coherence_check_done"
  | "quality_report"
  | "autoloop_iteration"
  // M19.22: Context Enrichment (pre-research)
  | "context_enrichment_started"
  | "context_enrichment_done"
  // M19.23: Structure Discovery + Data Completeness Gate
  | "structure_discovered"
  | "missing_data"
  | "missing_data_resolved"
  // M19.24: Legal Classifier + Risk Advisory
  | "legal_classification"
  | "risk_advisory";

// M18.d + M19.5 + M19.7: Agent thought (narración en vivo del agente, estilo Claude)
export type AgentThoughtKind =
  | "narration"       // párrafo de prosa (markdown) del agente
  | "tool_call"       // invocando una herramienta (con request/response)
  | "tool_result"     // legacy: resultado de tool (prefer tool_call con response)
  | "correction"      // sugerencia de corrección legal
  | "warning"         // nota legal importante
  | "success"         // hito completado
  | "info"            // legacy: log genérico
  | "error"           // algo falló
  | "presented_file"; // M19.7: chip especial con archivo DOCX adjunto

export interface AgentThought {
  id: string;                // timestamp + random
  kind: AgentThoughtKind;
  message: string;
  tool?: string | null;
  ref?: string | null;
  url?: string | null;
  suggestion?: string | null;
  timestamp: number;
  // M19.5: capacidades estilo Claude
  toolId?: string | null;            // id único para correlar request/response
  toolRequest?: any;                  // JSON args al tool
  toolResponse?: any;                 // JSON respuesta del tool
  toolError?: string | null;
  toolDurationMs?: number | null;
  threadId?: string | null;           // agrupa thoughts en un solo mensaje del agente
}

// M19.5: detalle de un tool call para renderizar en ToolCallChip
export interface ToolCallDetail {
  id: string;
  name: string;                       // 'brave_search', 'judge', 'preflight_check', etc.
  status: "running" | "done" | "error";
  request?: any;
  response?: any;
  error?: string | null;
  durationMs?: number | null;
  startedAt: number;
}

// M19.5: mensaje compuesto del asistente (prosa + tools intercalados)
export interface AssistantNarrativeMessage {
  id: string;                         // = threadId del backend
  role: "assistant";
  segments: AssistantSegment[];       // ordenados temporalmente
  startedAt: number;
  finishedAt?: number | null;
  isStreaming: boolean;
}

export type AssistantSegment =
  | { type: "paragraph"; id: string; markdown: string; timestamp: number }
  | { type: "tool"; id: string; tool: ToolCallDetail; timestamp: number }
  // M19.9: grupo de ≥2 tools consecutivos. Renderiza como línea colapsable
  // estilo Claude ("Usó N herramientas ›") en lugar de N chips visibles.
  | { type: "tool_group"; id: string; tools: ToolCallDetail[]; timestamp: number };

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

// M19.23.B — Structure Recipe (plan de estructura descubierto dinámicamente)
export interface StructureRecipeData {
  structure_key: string;
  doc_type: string;
  jurisdiccion?: string | null;
  cuantia_rango?: string | null;
  demandado_tipo?: string | null;
  procedimiento?: string | null;
  sections_plan: Array<{
    key: string;
    title: string;
    order: number;
    roman?: string | null;
    expected_blocks?: string[];
  }>;
  norma_procesal_ref?: string | null;
  juramento_norma_ref?: string | null;
  juez_competente?: string | null;
  cuerpos_normativos_minimos?: string[];
  // M19.24 — campos universales
  document_family?: string | null;
  regimen_aplicable?: string | null;
  naturaleza_acto?: string | null;
  encabezado_tipo?: string | null;
  cierre_tipo?: string | null;
  numeracion_estilo?: string | null;
  requires_pretensiones?: boolean | null;
  requires_hechos?: boolean | null;
  requires_juramento?: boolean | null;
  playbooks?: Record<string, string[]>;
  cached: boolean;
  fallback_used: boolean;
  duration_ms: number;
  sections_count?: number;
}

// M19.24 — Legal Classifier types
export interface PremisaCorregida {
  usuario_dijo: string;
  correcto: string;
  razon: string;
  fuente?: string | null;
}

export interface CitaVerificada {
  ref: string;
  exists: boolean;
  max_in_law?: number | null;
  suggested_correction?: string | null;
}

export interface LegalClassificationData {
  document_family: string;
  regimen_aplicable?: string | null;
  naturaleza_acto?: string | null;
  fundamento_normativo: string[];
  premisas_corregidas: PremisaCorregida[];
  advertencias_riesgo: string[];
  citas_verificadas: CitaVerificada[];
  reasoning: string;
  cached: boolean;
  skipped: boolean;
  duration_ms: number;
}

export interface RiskAdvisory {
  field_key: string;
  severity: "critical" | "warning" | "info";
  falta: string;
  consecuencia: string;
  recomendacion: string;
  fuente_legal?: string | null;
}

// M19.23.C — Missing Data Report
export interface MissingField {
  field_key: string;
  label: string;
  description: string;
  severity: "critical" | "optional";
  suggested_placeholder?: string | null;
  example_value?: string | null;
}

export interface MissingDataReport {
  doc_type: string;
  required_fields_count: number;
  extracted_fields_count: number;
  missing_critical: MissingField[];
  missing_optional: MissingField[];
  can_continue: boolean;
  borrador_mode: boolean;
  skipped: boolean;
  reasoning: string;
  missing_summary: string;
  duration_ms: number;
}

// M19.20.D — Quality Report (combinación de completeness + coherence + qa + citations)
export interface QualityScores {
  completeness: number;
  coherence: number;
  qa_rules: number;
  citation_existence: number;
}

export interface QualityIssue {
  source: "completeness" | "coherence" | "qa" | "citations";
  issue: string;
  severity: "critical" | "warning" | "info";
  suggested_fix?: string | null;
}

export interface QualityReport {
  doc_type: string;
  ready_for_signature: boolean;
  overall_score: number;
  blocking_issues_count: number;
  scores: QualityScores;
  completeness?: any;
  coherence?: any;
  qa?: any;
  citation_existence_rate: number;
  blocking_issues: QualityIssue[];
  advisory_issues: QualityIssue[];
  summary: string;
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
  // M19.17.D — timestamp del último REPLACE_BLOCKS para forzar remount del canvas
  lastEditAt: number | null;
  // M19.17.D — flag mientras hay edit en vuelo (refresh pendiente)
  isSyncing: boolean;
  // M19.20 — Quality Report del último análisis
  qualityReport: QualityReport | null;
  // M19.23 — Structure Discovery + Data Completeness
  structureRecipe: StructureRecipeData | null;
  missingDataReport: MissingDataReport | null;
  // M19.24 — Legal Classifier + Risk Advisories
  legalClassification: LegalClassificationData | null;
  riskAdvisories: RiskAdvisory[];
}
