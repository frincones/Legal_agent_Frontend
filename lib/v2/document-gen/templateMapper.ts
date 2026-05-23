/**
 * Mapea (DocType + Materia) del intentDetector → template_id v2 del backend.
 *
 * El backend Sprint M2 expone 12 TemplateDef:
 *   demanda_laboral_ordinaria, demanda_civil_ordinaria, demanda_ejecutivo_singular,
 *   demanda_alimentos, tutela, derecho_peticion, contrato_arrendamiento,
 *   contrato_prestacion_servicios, denuncia_penal, recurso_apelacion,
 *   concepto_juridico, poder_especial.
 *
 * Este módulo es la "última milla" entre el intent detector heurístico y
 * el motor v2. Si no hay match exacto, devuelve null y el motor v2 dispara
 * su propio classifier server-side.
 */
import type { DocType, Materia } from "./intentDetector";

export type TemplateIdV2 =
  | "demanda_laboral_ordinaria"
  | "demanda_civil_ordinaria"
  | "demanda_ejecutivo_singular"
  | "demanda_alimentos"
  | "tutela"
  | "derecho_peticion"
  | "contrato_arrendamiento"
  | "contrato_prestacion_servicios"
  | "denuncia_penal"
  | "recurso_apelacion"
  | "concepto_juridico"
  | "poder_especial";

export function mapToTemplateId(
  docType: DocType | null,
  materia: Materia | null,
  rawInput?: string
): TemplateIdV2 | null {
  if (!docType) return null;

  switch (docType) {
    case "tutela":
      return "tutela";

    case "demanda": {
      if (materia === "laboral") return "demanda_laboral_ordinaria";
      if (materia === "familia") {
        const lower = (rawInput || "").toLowerCase();
        if (lower.includes("alimento")) return "demanda_alimentos";
        return "demanda_civil_ordinaria";
      }
      if (materia === "civil" || materia === "comercial") {
        const lower = (rawInput || "").toLowerCase();
        if (lower.includes("ejecutiv")) return "demanda_ejecutivo_singular";
        return "demanda_civil_ordinaria";
      }
      return "demanda_civil_ordinaria"; // fallback
    }

    case "contrato": {
      const lower = (rawInput || "").toLowerCase();
      if (lower.includes("arrend") || lower.includes("arriendo")) {
        return "contrato_arrendamiento";
      }
      return "contrato_prestacion_servicios";
    }

    case "derecho_peticion":
      return "derecho_peticion";

    case "denuncia":
      return "denuncia_penal";

    case "recurso":
      return "recurso_apelacion";

    case "poder":
      return "poder_especial";

    case "minuta":
    case "memorial":
    case "habeas_data":
    case "conciliacion":
      // Sin TemplateDef específico aún — backend classifier decide
      return null;
  }
}
