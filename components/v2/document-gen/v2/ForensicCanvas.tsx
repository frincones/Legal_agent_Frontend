"use client";

import * as React from "react";
import type { Block } from "@/lib/types/blocks";
import { BlockRenderer } from "./BlockRenderer";

interface Props {
  blocks: Block[];
  status: "idle" | "running" | "completed" | "error";
}

export function ForensicCanvas({ blocks, status }: Props) {
  return (
    <div className="relative h-full overflow-y-auto bg-white">
      <div
        className="mx-auto max-w-3xl my-6 px-12 py-10 bg-white shadow-md border border-zinc-200"
        style={{ minHeight: "calc(100vh - 8rem)" }}
      >
        {blocks.length === 0 && status === "idle" && (
          <div className="text-center text-zinc-400 py-20">
            <p className="text-lg">El documento aparecerá aquí</p>
            <p className="text-sm mt-2">Escribe el intent y presiona Generar para empezar.</p>
          </div>
        )}
        {blocks.length === 0 && status === "running" && (
          <div className="text-center text-zinc-400 py-20 animate-pulse">
            <p className="text-sm">Preparando documento…</p>
          </div>
        )}
        {blocks.map((block) => (
          <BlockRenderer key={block.block_id} block={block} />
        ))}
        {status === "running" && blocks.length > 0 && (
          <span className="inline-block w-2 h-4 bg-zinc-800 animate-pulse ml-1" aria-hidden />
        )}
      </div>
    </div>
  );
}
