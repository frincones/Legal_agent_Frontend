"use client";

/**
 * Sprint M8 · Modal de captura de brief antes de redirigir a /v2/canvas/draft?engine=v2
 *
 * Cuando el composer detecta intent doc_gen pero el prompt NO contiene datos del caso,
 * abrimos este modal para capturar los datos mínimos del TemplateDef (required_data).
 *
 * Sin brief, el motor v2 emite el documento con placeholders [NOMBRE_DEMANDANTE], etc.
 * Con brief, los placeholders se reemplazan por valores reales.
 *
 * El usuario puede:
 *   - Llenar los campos y "Generar"
 *   - "Saltar" → generar con placeholders (M8 fallback)
 *   - "Cancelar" → vuelve al chat normal
 */

import * as React from "react";

export interface BriefModalProps {
  open: boolean;
  intent: string;
  templateId: string | null;
  onConfirm: (brief: string) => void;
  onSkip: () => void;
  onCancel: () => void;
}

// Campos a pedir por template_id. Si no aparece, no se pide brief (fallback).
const TEMPLATE_FIELDS: Record<string, Array<{ key: string; label: string; placeholder?: string; type?: string }>> = {
  demanda_laboral_ordinaria: [
    { key: "demandante_nombre", label: "Nombre del demandante", placeholder: "María Pérez González" },
    { key: "demandante_cc", label: "C.C. demandante", placeholder: "1.234.567.890" },
    { key: "demandada_razon_social", label: "Razón social demandada", placeholder: "Comercializadora XYZ SAS" },
    { key: "demandada_nit", label: "NIT demandada", placeholder: "900.123.456-7" },
    { key: "salario_mensual", label: "Salario mensual (COP)", placeholder: "2500000", type: "number" },
    { key: "fecha_ingreso", label: "Fecha ingreso", placeholder: "2019-03-15", type: "date" },
    { key: "fecha_despido", label: "Fecha despido", placeholder: "2026-04-30", type: "date" },
    { key: "cargo", label: "Cargo", placeholder: "Asistente Administrativa" },
    { key: "ciudad", label: "Ciudad", placeholder: "Bogotá D.C." },
  ],
  demanda_civil_ordinaria: [
    { key: "demandante_nombre", label: "Demandante" },
    { key: "demandado_nombre", label: "Demandado" },
    { key: "pretension_principal", label: "Pretensión principal" },
    { key: "monto_reclamado", label: "Monto reclamado", type: "number" },
    { key: "fecha_hechos", label: "Fecha de los hechos", type: "date" },
    { key: "ciudad", label: "Ciudad" },
  ],
  demanda_ejecutivo_singular: [
    { key: "demandante_nombre", label: "Demandante" },
    { key: "demandado_nombre", label: "Demandado" },
    { key: "titulo_tipo", label: "Tipo título (pagaré/factura/sentencia)" },
    { key: "monto_capital", label: "Capital adeudado (COP)", type: "number" },
    { key: "fecha_titulo", label: "Fecha del título", type: "date" },
    { key: "tasa_interes", label: "Tasa de interés (% anual)", type: "number" },
    { key: "ciudad", label: "Ciudad" },
  ],
  demanda_alimentos: [
    { key: "demandante_nombre", label: "Demandante (madre/padre)" },
    { key: "demandado_nombre", label: "Demandado (alimentante)" },
    { key: "menor_nombre", label: "Nombre del menor" },
    { key: "menor_edad", label: "Edad del menor", type: "number" },
    { key: "alimentante_ingresos", label: "Ingresos del alimentante (COP/mes)", type: "number" },
    { key: "ciudad", label: "Ciudad" },
  ],
  tutela: [
    { key: "accionante_nombre", label: "Accionante" },
    { key: "accionante_cc", label: "C.C." },
    { key: "accionado_entidad", label: "Entidad accionada", placeholder: "EPS Sura" },
    { key: "derecho_vulnerado", label: "Derecho fundamental vulnerado", placeholder: "Salud" },
    { key: "fecha_hecho", label: "Fecha del hecho", type: "date" },
    { key: "ciudad", label: "Ciudad" },
  ],
  derecho_peticion: [
    { key: "peticionario_nombre", label: "Peticionario" },
    { key: "peticionario_cc", label: "C.C." },
    { key: "entidad_destinataria", label: "Entidad destinataria" },
    { key: "peticion_concreta", label: "Petición concreta" },
    { key: "ciudad", label: "Ciudad" },
  ],
  contrato_arrendamiento: [
    { key: "arrendador_nombre", label: "Arrendador" },
    { key: "arrendador_cc", label: "C.C./NIT arrendador" },
    { key: "arrendatario_nombre", label: "Arrendatario" },
    { key: "arrendatario_cc", label: "C.C. arrendatario" },
    { key: "inmueble_direccion", label: "Dirección del inmueble" },
    { key: "canon_mensual", label: "Canon mensual (COP)", type: "number" },
    { key: "duracion_meses", label: "Duración (meses)", type: "number" },
    { key: "ciudad", label: "Ciudad" },
  ],
  contrato_prestacion_servicios: [
    { key: "contratante_nombre", label: "Contratante" },
    { key: "contratante_nit_cc", label: "C.C./NIT contratante" },
    { key: "contratista_nombre", label: "Contratista" },
    { key: "contratista_nit_cc", label: "C.C./NIT contratista" },
    { key: "objeto_servicio", label: "Objeto del servicio" },
    { key: "valor_total", label: "Valor total (COP)", type: "number" },
    { key: "duracion_meses", label: "Duración (meses)", type: "number" },
  ],
  denuncia_penal: [
    { key: "denunciante_nombre", label: "Denunciante" },
    { key: "denunciante_cc", label: "C.C. denunciante" },
    { key: "denunciado_nombre", label: "Denunciado" },
    { key: "delito", label: "Delito" },
    { key: "fecha_hecho", label: "Fecha del hecho", type: "date" },
    { key: "lugar_hecho", label: "Lugar del hecho" },
  ],
  recurso_apelacion: [
    { key: "recurrente_nombre", label: "Recurrente" },
    { key: "providencia_referencia", label: "Providencia impugnada (ref.)" },
    { key: "fecha_providencia", label: "Fecha providencia", type: "date" },
    { key: "juzgado_origen", label: "Juzgado de origen" },
    { key: "motivos_impugnacion", label: "Motivos de impugnación" },
  ],
  concepto_juridico: [
    { key: "consultante", label: "Consultante" },
    { key: "problema_juridico", label: "Problema jurídico" },
    { key: "fecha_consulta", label: "Fecha de consulta", type: "date" },
  ],
  poder_especial: [
    { key: "poderdante_nombre", label: "Poderdante" },
    { key: "poderdante_cc", label: "C.C. poderdante" },
    { key: "apoderado_nombre", label: "Apoderado" },
    { key: "apoderado_tp", label: "T.P. apoderado" },
    { key: "asunto", label: "Asunto" },
    { key: "ciudad", label: "Ciudad" },
  ],
};

export function BriefModal({ open, intent, templateId, onConfirm, onSkip, onCancel }: BriefModalProps) {
  const fields = templateId && TEMPLATE_FIELDS[templateId] ? TEMPLATE_FIELDS[templateId] : null;
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) setValues({});
  }, [open, templateId]);

  if (!open) return null;
  if (!fields) {
    // Sin fields conocidos, brief = intent crudo
    onConfirm(intent);
    return null;
  }

  const submit = () => {
    const lines = fields
      .filter((f) => values[f.key]?.trim())
      .map((f) => `${f.label}: ${values[f.key]?.trim()}`);
    const brief = lines.join("\n");
    onConfirm(brief);
  };

  const filledCount = fields.filter((f) => values[f.key]?.trim()).length;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white", borderRadius: 12, maxWidth: 640, width: "92%",
          maxHeight: "90vh", overflowY: "auto", padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Datos del caso</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {templateId} · Completa los datos para que el agente genere el documento real (no placeholders)
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <p className="text-xs italic text-zinc-600 mb-3 bg-zinc-50 p-2 rounded">
          Intent: "{intent}"
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key} className={f.label.length > 30 ? "md:col-span-2" : ""}>
              <label className="text-xs font-medium text-zinc-700">{f.label}</label>
              <input
                type={f.type || "text"}
                value={values[f.key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder || ""}
                className="w-full mt-1 text-sm border border-zinc-300 rounded px-2 py-1.5"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {filledCount}/{fields.length} campos llenados
            {filledCount === 0 && " · puedes saltar y usar placeholders"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="text-sm px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50"
            >
              Saltar (usar placeholders)
            </button>
            <button
              onClick={submit}
              disabled={filledCount === 0}
              className="text-sm px-4 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-40"
            >
              ⚡ Generar con estos datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
