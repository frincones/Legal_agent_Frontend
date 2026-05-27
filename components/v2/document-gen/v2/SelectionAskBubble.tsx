"use client";

/**
 * M19.16.F2 — Popover de "pídeselo a LexAI" cuando el usuario selecciona texto
 * en el EditableDocxCanvas. Inspirado en ChatGPT Canvas + Harvey AI.
 *
 * Flujo:
 *   1. Usuario selecciona texto dentro de un bloque editable
 *   2. EditableDocxCanvas emite onSelectionAsk con {block_id, text, from, to}
 *   3. ForensicCanvas monta este popover
 *   4. Usuario click "Reescribir" / "Resumir" / "Pedir cambio" → POST /chat
 *      con body.selection = {block_id, text, instruction}
 *   5. El backend procesa con la selección como contexto privilegiado y
 *      retorna actions[] que se aplican vía _update_block_runs
 *   6. Tras el éxito, el frontend refresca el bloque
 */

import * as React from "react";
import type { SelectionContext } from "./EditableDocxCanvas";

interface Props {
  selection: SelectionContext;
  documentId: string;
  onDismiss: () => void;
}

type QuickAction = {
  id: string;
  label: string;
  instruction: string;
  emoji: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: "resumir", label: "Resumir", emoji: "📝", instruction: "Resume esto en una sola frase, manteniendo el sentido jurídico." },
  { id: "expandir", label: "Expandir", emoji: "✍", instruction: "Expande este texto con más detalle y argumentación jurídica." },
  { id: "formal", label: "Más formal", emoji: "⚖", instruction: "Reescribe esto en tono más formal, propio de un memorial forense." },
  { id: "corregir", label: "Corregir", emoji: "✓", instruction: "Corrige errores gramaticales y de estilo sin cambiar el contenido." },
];

export function SelectionAskBubble({ selection, documentId, onDismiss }: Props) {
  const [customMsg, setCustomMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runAction = React.useCallback(
    async (instruction: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/documents/v2/documents/${encodeURIComponent(documentId)}/chat`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              message: instruction,
              selection: {
                block_id: selection.block_id,
                text: selection.text,
                instruction,
                // M19.17.A — anchors para reemplazo quirúrgico sin ambigüedad
                anchor_before: selection.anchor_before || "",
                anchor_after: selection.anchor_after || "",
              },
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.blocks_changed > 0) {
          // M19.17.C — incluir metadata para que el auditor sepa qué se cambió y por qué
          window.dispatchEvent(
            new CustomEvent("lexai:doc-changed", {
              detail: {
                documentId,
                source: "selection-bubble",
                edited_block_id: selection.block_id,
                user_instruction: instruction,
              },
            })
          );
          onDismiss();
        } else {
          setError(data?.reply || "Sin cambios aplicados.");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [documentId, selection, onDismiss]
  );

  const submitCustom = React.useCallback(() => {
    const msg = customMsg.trim();
    if (msg.length < 3) return;
    runAction(msg);
  }, [customMsg, runAction]);

  return (
    <div
      className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-2xl rounded-lg px-3 py-2.5 flex flex-col gap-2 min-w-[420px] max-w-[560px]"
      role="dialog"
      aria-label="Pedir cambio sobre selección"
      style={{ fontFamily: "'Source Serif Pro', Georgia, serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span className="truncate flex-1">
          <span className="font-medium text-zinc-700">Seleccionado:</span>{" "}
          <span className="italic">
            “{selection.text.length > 80 ? selection.text.slice(0, 77) + "…" : selection.text}”
          </span>
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-400 hover:text-zinc-700 text-sm px-1"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={loading}
            onClick={() => runAction(a.instruction)}
            className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition disabled:opacity-50"
            title={a.instruction}
          >
            <span aria-hidden>{a.emoji}</span> {a.label}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitCustom();
            if (e.key === "Escape") onDismiss();
          }}
          placeholder="✨ Pídeselo a LexAI… (ej: 'agrega referencia al Art. 24 CST')"
          disabled={loading}
          className="flex-1 text-sm px-2.5 py-1.5 border border-zinc-200 rounded outline-none focus:border-blue-400 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submitCustom}
          disabled={loading || customMsg.trim().length < 3}
          className="text-xs px-3 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40"
        >
          {loading ? "…" : "Enviar"}
        </button>
      </div>

      {/* Estado */}
      {error && (
        <div className="text-[11px] text-red-600 italic">{error}</div>
      )}
      {loading && !error && (
        <div className="text-[11px] text-zinc-500 italic animate-pulse">
          LexAI está aplicando el cambio…
        </div>
      )}
    </div>
  );
}
