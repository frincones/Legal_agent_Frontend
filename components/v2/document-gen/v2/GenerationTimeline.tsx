"use client";

import * as React from "react";
import type { TimelineStep } from "@/lib/types/blocks";

const ICONS: Record<TimelineStep["type"], string> = {
  classification: "📋",
  extraction: "🔍",
  calculation: "🧮",
  hunters: "⚖️",
  derogation: "✅",
  section: "✍️",
  polish: "✨",
  qa: "🔎",
  docx: "📄",
  audit: "📊",
};

function StatusIndicator({ status }: { status: TimelineStep["status"] }) {
  if (status === "completed") return <span className="text-emerald-600">✓</span>;
  if (status === "in_progress") return <span className="inline-block animate-spin">⠋</span>;
  if (status === "error") return <span className="text-red-600">✗</span>;
  return <span className="text-zinc-400">⏱</span>;
}

function StepRow({ step, expanded, onToggle }: { step: TimelineStep; expanded: boolean; onToggle: () => void }) {
  const dur = step.durationMs ? `${(step.durationMs / 1000).toFixed(1)}s` : "";
  const icon = ICONS[step.type] || "•";
  const hasDetails = !!step.details && Object.keys(step.details).length > 0;

  return (
    <div className="border-b border-zinc-100">
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        disabled={!hasDetails}
        className={`w-full text-left py-2 px-2 flex items-center gap-2 text-xs hover:bg-zinc-50
          ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className="text-sm" aria-hidden>{icon}</span>
        <span className="flex-1 truncate" title={step.title}>{step.title}</span>
        <span className="text-zinc-400 text-[10px]">{dur}</span>
        <StatusIndicator status={step.status} />
        {hasDetails && <span className="text-zinc-300 text-[10px]">{expanded ? "▾" : "▸"}</span>}
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-2 pt-1 text-[10px] text-zinc-600 bg-zinc-50 max-h-48 overflow-auto">
          <StepDetails step={step} />
        </div>
      )}
    </div>
  );
}

function StepDetails({ step }: { step: TimelineStep }) {
  const d = step.details || {};
  if (step.type === "classification") {
    return (
      <div className="space-y-0.5">
        <div><b>doc_type:</b> {d.doc_type}</div>
        <div><b>jurisdicción:</b> {d.jurisdiccion}</div>
        <div><b>materia:</b> {d.materia}</div>
        <div><b>confidence:</b> {d.confidence?.toFixed?.(2) ?? d.confidence}</div>
      </div>
    );
  }
  if (step.type === "extraction") {
    const fields = Object.keys(d.extracted_fields || {});
    return (
      <div>
        <div><b>extraídos ({fields.length}):</b> {fields.join(", ") || "(ninguno)"}</div>
        {d.missing_fields?.length > 0 && (
          <div className="text-amber-700"><b>faltantes:</b> {d.missing_fields.join(", ")}</div>
        )}
      </div>
    );
  }
  if (step.type === "calculation") {
    const conceptos = d.conceptos || {};
    return (
      <div>
        {Object.entries(conceptos).map(([k, v]) => (
          <div key={k}>· <b>{k}:</b> {String(v)}</div>
        ))}
        {d.total && <div className="mt-1 font-bold">TOTAL: {d.total}</div>}
      </div>
    );
  }
  if (step.type === "hunters") {
    return (
      <div>
        {d.last_query?.query && <div><b>última query:</b> {d.last_query.query}</div>}
        {d.sentencias > 0 && <div><b>sentencias encontradas:</b> {d.sentencias}</div>}
      </div>
    );
  }
  if (step.type === "polish") {
    return (
      <div>
        <div><b>chars polished:</b> {d.polished_chars}</div>
        <div><b>delta:</b> {d.delta_chars > 0 ? "+" : ""}{d.delta_chars}</div>
      </div>
    );
  }
  if (step.type === "qa") {
    return (
      <div>
        <div><b>passed:</b> {d.passed ? "sí" : "no"}</div>
        <div><b>score:</b> {d.score?.toFixed?.(2)}/10</div>
        {d.issues?.length > 0 && (
          <div className="text-amber-700"><b>issues:</b> {d.issues.join(", ")}</div>
        )}
      </div>
    );
  }
  if (step.type === "docx") {
    return (
      <div>
        <div><b>url:</b> {d.url}</div>
        <div><b>tamaño:</b> {d.size_kb} KB</div>
      </div>
    );
  }
  return <pre className="text-[10px]">{JSON.stringify(d, null, 2)}</pre>;
}

interface Props {
  steps: TimelineStep[];
  totalDurationMs?: number;
  collapsed?: boolean;
}

export function GenerationTimeline({ steps, totalDurationMs, collapsed }: Props) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [collapseAll, setCollapseAll] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (collapsed) setCollapseAll(true);
  }, [collapsed]);

  const toggle = (id: string) => {
    setExpandedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completed = steps.filter((s) => s.status === "completed").length;

  return (
    <div className="h-full overflow-y-auto bg-white border-r border-zinc-200">
      <div className="p-3 border-b border-zinc-200 bg-zinc-50">
        <h3 className="text-sm font-semibold">Timeline del agente</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          {completed}/{steps.length} pasos {totalDurationMs ? `· ${(totalDurationMs / 1000).toFixed(1)}s` : ""}
        </p>
        {steps.length > 0 && (
          <button
            type="button"
            onClick={() => setCollapseAll((v) => !v)}
            className="text-[10px] text-zinc-500 hover:text-zinc-700 mt-1"
          >
            {collapseAll ? "expandir todo" : "colapsar todo"}
          </button>
        )}
      </div>
      {!collapseAll && (
        <div className="divide-y divide-zinc-100">
          {steps.length === 0 && (
            <p className="text-xs text-zinc-400 p-4 text-center">Esperando…</p>
          )}
          {steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              expanded={expandedIds.has(step.id)}
              onToggle={() => toggle(step.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
