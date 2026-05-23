"use client";

import * as React from "react";
import type { Block, Run } from "@/lib/types/blocks";

// ============================================================
// Inline runs helper
// ============================================================

function RunSpan({ run }: { run: Run }) {
  let inner: React.ReactNode = run.text;
  if (run.bold) inner = <strong>{inner}</strong>;
  if (run.italic) inner = <em>{inner}</em>;
  if (run.underline) inner = <u>{inner}</u>;
  return <>{inner}</>;
}

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <RunSpan key={i} run={r} />
      ))}
    </>
  );
}

// ============================================================
// Block components
// ============================================================

function TitleBlockView({ block }: { block: Extract<Block, { type: "title" }> }) {
  const size = block.level === 0 ? "text-xl" : block.level === 1 ? "text-lg" : "text-base";
  return (
    <h1 className={`${size} font-bold text-center uppercase tracking-wide my-6 font-serif`}>
      {block.text}
    </h1>
  );
}

function SectionHeadingView({ block }: { block: Extract<Block, { type: "section_heading" }> }) {
  return (
    <h2
      data-section-key={block.section_key}
      className="text-base font-bold uppercase tracking-wide mt-6 mb-3 font-serif"
    >
      {block.roman}. {block.text}
    </h2>
  );
}

function SubsectionView({ block }: { block: Extract<Block, { type: "subsection" }> }) {
  return (
    <h3 className="text-sm font-bold underline mt-4 mb-2 font-serif">
      {block.number}. {block.text}
    </h3>
  );
}

function ParagraphView({ block }: { block: Extract<Block, { type: "paragraph" }> }) {
  const alignClass =
    block.align === "left" ? "text-left" :
    block.align === "right" ? "text-right" :
    block.align === "center" ? "text-center" : "text-justify";
  return (
    <p className={`${alignClass} leading-relaxed mb-2 indent-8 font-serif text-sm`}>
      <Runs runs={block.runs} />
    </p>
  );
}

function HechoView({ block }: { block: Extract<Block, { type: "hecho" }> }) {
  return (
    <div className="flex gap-2 mb-2 font-serif text-sm leading-relaxed">
      <span className="font-bold min-w-[2rem] text-right">{block.num}.</span>
      <span className="text-justify flex-1">
        <Runs runs={block.runs} />
      </span>
    </div>
  );
}

function PretensionView({ block }: { block: Extract<Block, { type: "pretension" }> }) {
  const tone =
    block.kind === "declarativa" ? "border-l-2 border-blue-300/40 pl-3" :
    block.kind === "condena" ? "border-l-2 border-amber-300/40 pl-3" :
    "";
  return (
    <div className={`mb-3 font-serif text-sm leading-relaxed ${tone}`}>
      <span className="font-bold">{block.ord}.</span>{" "}
      <span className="text-justify">
        <Runs runs={block.runs} />
      </span>
    </div>
  );
}

function NormaCitadaView({ block }: { block: Extract<Block, { type: "norma_citada" }> }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
        ${block.derogada
          ? "bg-red-50 text-red-800 line-through"
          : block.verified
            ? "bg-emerald-50 text-emerald-800"
            : "bg-zinc-100 text-zinc-700"
        }`}
      title={block.contenido?.map(r => r.text).join("") || block.norma}
    >
      {block.verified && !block.derogada && <span aria-hidden>✓</span>}
      {block.derogada && <span aria-hidden>✗</span>}
      {block.norma}
    </span>
  );
}

function JurisprudenciaView({ block }: { block: Extract<Block, { type: "jurisprudencia" }> }) {
  return (
    <div className="my-3 p-3 border-l-4 border-indigo-300 bg-indigo-50/50 rounded-r-md font-serif text-sm">
      <div className="flex items-center gap-2 text-xs text-indigo-900 mb-1">
        {block.verified && <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">✓ verificada</span>}
        <span className="font-bold">{block.id}</span>
        <span>·</span>
        <span>M.P. {block.mp}</span>
        <span>·</span>
        <span>{block.corte}</span>
        {block.sim_score !== null && block.sim_score !== undefined && (
          <span className="ml-auto text-zinc-500 text-[10px]">sim {block.sim_score.toFixed(2)}</span>
        )}
      </div>
      {block.ratio && block.ratio.length > 0 && (
        <p className="italic text-zinc-700 leading-relaxed">
          “<Runs runs={block.ratio} />”
        </p>
      )}
    </div>
  );
}

function SilogismoView({ block }: { block: Extract<Block, { type: "silogismo" }> }) {
  return (
    <div className="my-4 space-y-2 font-serif text-sm">
      <p className="text-justify">
        <span className="font-bold">Premisa Mayor (norma): </span>
        <Runs runs={block.premisa_mayor} />
      </p>
      <p className="text-justify">
        <span className="font-bold">Premisa Menor (hecho): </span>
        <Runs runs={block.premisa_menor} />
      </p>
      <p className="text-justify">
        <span className="font-bold">Conclusión: </span>
        <Runs runs={block.conclusion} />
      </p>
    </div>
  );
}

function TableView({ block }: { block: Extract<Block, { type: "table" }> }) {
  const totalIdx = block.has_total_row ? block.rows.length - 1 : -1;
  return (
    <table className="my-4 w-full border-collapse text-sm font-serif">
      <thead>
        <tr style={{ backgroundColor: block.header_shading || "#D9E1F2" }}>
          {block.header.map((h, i) => (
            <th key={i} className="border border-zinc-400 px-2 py-1 font-bold text-center">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, ri) => (
          <tr
            key={ri}
            style={ri === totalIdx ? { backgroundColor: block.total_row_shading || "#F2F2F2" } : undefined}
            className={ri === totalIdx ? "font-bold" : ""}
          >
            {row.map((cell, ci) => (
              <td key={ci} className="border border-zinc-400 px-2 py-1 align-middle">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CalcStepView({ block }: { block: Extract<Block, { type: "calc_step" }> }) {
  return (
    <div className="my-3 font-serif text-sm">
      <h4 className="font-bold underline mb-2">{block.label}</h4>
      <p className="text-center italic text-zinc-700">
        <span className="font-bold not-italic">Fórmula: </span>{block.formula}
      </p>
      <p className="text-center italic text-zinc-700 mt-1">
        <span className="font-bold not-italic">Aplicación: </span>{block.aplicacion}
      </p>
      <p className="text-center font-bold mt-2">{block.total}</p>
    </div>
  );
}

function ListItemView({ block }: { block: Extract<Block, { type: "list_item" }> }) {
  return (
    <div className="flex gap-2 mb-1 font-serif text-sm leading-relaxed pl-6">
      <span className="font-bold min-w-[1.5rem]">{block.num})</span>
      <span className="text-justify flex-1">
        <Runs runs={block.runs} />
      </span>
    </div>
  );
}

function JuramentoView({ block }: { block: Extract<Block, { type: "juramento" }> }) {
  return (
    <div className="my-6 p-4 border-2 border-zinc-300 rounded-md bg-zinc-50/50">
      <h3 className="text-base font-bold uppercase text-center mb-2 font-serif">JURAMENTO</h3>
      {block.norma_ref && (
        <p className="text-xs text-zinc-500 text-center mb-2 italic">{block.norma_ref}</p>
      )}
      <p className="text-justify font-serif text-sm leading-relaxed">{block.text}</p>
    </div>
  );
}

function FirmaView({ block }: { block: Extract<Block, { type: "firma" }> }) {
  return (
    <div className="mt-8 font-serif text-sm">
      <p className="text-right italic mb-6">{block.ciudad_fecha}</p>
      <p className="mb-1">Atentamente,</p>
      <div className="mt-12 border-t border-zinc-400 pt-1 w-72">
        <p className="font-bold">{block.nombre}</p>
        <p>Abogado · T.P. No. {block.tp} del C.S.J.</p>
        {block.cc && <p>C.C. No. {block.cc}</p>}
        {(block.email || block.telefono) && (
          <p className="text-xs text-zinc-600">
            {block.email && `Email: ${block.email}`}
            {block.email && block.telefono && " · "}
            {block.telefono && `Tel.: ${block.telefono}`}
          </p>
        )}
      </div>
    </div>
  );
}

function BlankView() {
  return <div className="h-3" />;
}

// ============================================================
// Dispatcher
// ============================================================

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "title":           return <TitleBlockView block={block} />;
    case "section_heading": return <SectionHeadingView block={block} />;
    case "subsection":      return <SubsectionView block={block} />;
    case "paragraph":       return <ParagraphView block={block} />;
    case "hecho":           return <HechoView block={block} />;
    case "pretension":      return <PretensionView block={block} />;
    case "norma_citada":    return <NormaCitadaView block={block} />;
    case "jurisprudencia":  return <JurisprudenciaView block={block} />;
    case "silogismo":       return <SilogismoView block={block} />;
    case "table":           return <TableView block={block} />;
    case "calc_step":       return <CalcStepView block={block} />;
    case "list_item":       return <ListItemView block={block} />;
    case "juramento":       return <JuramentoView block={block} />;
    case "firma":           return <FirmaView block={block} />;
    case "blank":           return <BlankView />;
    default:                return null;
  }
}
