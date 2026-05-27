"use client";

/**
 * M19.20.F — Certificación de calidad del documento generado.
 *
 * Muestra el QualityReport del backend con:
 *   - Badge "✓ Listo para firma" (verde) o "⚠ No listo" (rojo)
 *   - Score general 0-100% + 4 scores parciales (completeness, coherence, qa, citations)
 *   - Lista de issues bloqueantes (severity=critical) y advisorios
 *   - Sugerencias de fix accionables
 *
 * Se renderiza en el tab "⚖ Audit" del IntegratedGenerationCanvas (reutiliza
 * el slot existente).
 */

import * as React from "react";
import type { QualityReport, QualityIssue } from "@/lib/types/blocks";

interface Props {
  report: QualityReport | null;
}

const SEVERITY_COLOR: Record<QualityIssue["severity"], { bg: string; text: string; border: string; icon: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", icon: "⛔" },
  warning: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: "⚠" },
  info: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", icon: "ℹ" },
};

const SOURCE_LABEL: Record<string, string> = {
  completeness: "Completitud",
  coherence: "Coherencia",
  qa: "QA reglas",
  citations: "Citas",
};

function scoreColor(score: number): string {
  if (score >= 0.85) return "text-emerald-700 bg-emerald-50 border-emerald-300";
  if (score >= 0.6) return "text-amber-700 bg-amber-50 border-amber-300";
  return "text-red-700 bg-red-50 border-red-300";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? "bg-emerald-500" : score >= 0.6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-700 font-medium">{label}</span>
        <span className="text-zinc-500 tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: QualityIssue }) {
  const style = SEVERITY_COLOR[issue.severity];
  return (
    <div className={`border ${style.border} ${style.bg} rounded px-2.5 py-1.5 text-[11.5px] ${style.text}`}>
      <div className="flex items-start gap-1.5">
        <span aria-hidden className="mt-0.5">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase font-semibold opacity-70">
              {SOURCE_LABEL[issue.source] || issue.source}
            </span>
          </div>
          <div className="mb-1">{issue.issue}</div>
          {issue.suggested_fix && (
            <div className="text-[11px] italic opacity-90">
              <span className="font-medium">Sugerencia: </span>{issue.suggested_fix}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function QualityCertification({ report }: Props) {
  if (!report) {
    return (
      <div className="p-6 text-center text-sm text-zinc-500">
        <p>La certificación de calidad aparece cuando termine la generación.</p>
      </div>
    );
  }

  const overall = Math.round(report.overall_score * 100);
  const ready = report.ready_for_signature;

  return (
    <div className="p-4 space-y-4 max-w-3xl">
      {/* Headline */}
      <div
        className={`border-2 rounded-lg p-4 flex items-center gap-3 ${
          ready
            ? "bg-emerald-50 border-emerald-300"
            : "bg-red-50 border-red-300"
        }`}
      >
        <div className="text-3xl" aria-hidden>
          {ready ? "✓" : "⚠"}
        </div>
        <div className="flex-1">
          <div className={`text-sm font-bold ${ready ? "text-emerald-800" : "text-red-800"}`}>
            {ready ? "Documento LISTO para firma" : "Documento NO listo para firma"}
          </div>
          <div className="text-xs text-zinc-600 mt-0.5">{report.summary}</div>
        </div>
        <div
          className={`text-2xl font-bold px-3 py-1 rounded border ${scoreColor(report.overall_score)}`}
        >
          {overall}%
        </div>
      </div>

      {/* Scores breakdown */}
      <div className="border border-zinc-200 rounded-lg p-3 bg-white">
        <div className="text-[11px] font-medium text-zinc-500 uppercase mb-2">
          Desglose de calidad
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <ScoreBar label="Completitud" score={report.scores.completeness ?? 0} />
          <ScoreBar label="Coherencia" score={report.scores.coherence ?? 0} />
          <ScoreBar label="QA reglas" score={report.scores.qa_rules ?? 0} />
          <ScoreBar label="Citas verificadas" score={report.scores.citation_existence ?? 0} />
        </div>
      </div>

      {/* Blocking issues */}
      {report.blocking_issues.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-red-700 uppercase">
            ⛔ Bloqueantes ({report.blocking_issues.length})
          </div>
          <div className="space-y-1.5">
            {report.blocking_issues.map((issue, idx) => (
              <IssueRow key={`b${idx}`} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Advisory issues */}
      {report.advisory_issues.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-amber-700 uppercase">
            Sugerencias opcionales ({report.advisory_issues.length})
          </div>
          <div className="space-y-1.5">
            {report.advisory_issues.map((issue, idx) => (
              <IssueRow key={`a${idx}`} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-100 pt-3 text-[10px] text-zinc-400">
        Doc type: {report.doc_type} · Certificación generada por LexAI Quality Loop M19.20.
        Las correcciones aplicadas desde el chat o auditor recalculan automáticamente este reporte.
      </div>
    </div>
  );
}
