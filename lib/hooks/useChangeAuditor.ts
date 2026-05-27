"use client";

/**
 * M19.17.C — Hook que escucha el evento global `lexai:doc-changed` y dispara
 * el auditor (POST /audit-change) tras cada edit del documento.
 *
 * El resultado (findings) se acumula en estado local y se expone para que
 * `ChangeAuditSuggestions` lo muestre en el chat panel.
 *
 * Toggle de feature: `localStorage.setItem("lexai_auditor_enabled", "false")`
 * para apagar el auditor (default: true).
 */

import * as React from "react";

export type AuditSeverity = "critical" | "warning" | "info";
export type AuditDimension =
  | "coherencia_interna"
  | "dependencias"
  | "riesgos"
  | "vacios"
  | "pretensiones"
  | "liquidacion"
  | "procesales"
  | "buenas_practicas";

export interface AuditFinding {
  block_id: string;
  dimension: AuditDimension | string;
  severity: AuditSeverity;
  issue: string;
  suggested_change: string;
}

export interface AuditResult {
  id: string; // local UUID para identificar este audit run
  documentId: string;
  edited_block_id: string;
  user_instruction: string;
  coherence_score: number;
  summary: string;
  findings: AuditFinding[];
  createdAt: number;
  loading: boolean;
  error?: string | null;
  dismissed?: boolean;
}

const STORAGE_KEY = "lexai_auditor_enabled";

export function isAuditorEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v !== "false";
}

export function setAuditorEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

interface UseChangeAuditorResult {
  audits: AuditResult[];
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  dismissAudit: (id: string) => void;
  clearAll: () => void;
}

export function useChangeAuditor(documentId: string | null): UseChangeAuditorResult {
  const [audits, setAudits] = React.useState<AuditResult[]>([]);
  const [enabled, setEnabledState] = React.useState<boolean>(true);
  // refs para no perder valor en closures
  const enabledRef = React.useRef(true);
  const documentIdRef = React.useRef<string | null>(documentId);

  React.useEffect(() => {
    setEnabledState(isAuditorEnabled());
  }, []);

  React.useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  React.useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  const setEnabled = React.useCallback((v: boolean) => {
    setEnabledState(v);
    setAuditorEnabled(v);
  }, []);

  const dismissAudit = React.useCallback((id: string) => {
    setAudits((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }, []);

  const clearAll = React.useCallback(() => {
    setAudits([]);
  }, []);

  React.useEffect(() => {
    const handler = async (ev: Event) => {
      if (!enabledRef.current) return;
      const docId = documentIdRef.current;
      if (!docId) return;
      const detail = (ev as CustomEvent).detail as
        | {
            documentId?: string;
            edited_block_id?: string;
            before_block_data?: any;
            user_instruction?: string;
            source?: string;
          }
        | undefined;
      if (!detail?.edited_block_id) return; // solo audit si vino metadata
      if (detail.documentId && detail.documentId !== docId) return;

      const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const stub: AuditResult = {
        id: auditId,
        documentId: docId,
        edited_block_id: detail.edited_block_id,
        user_instruction: detail.user_instruction || "",
        coherence_score: 1.0,
        summary: "",
        findings: [],
        createdAt: Date.now(),
        loading: true,
      };
      setAudits((prev) => [...prev.slice(-9), stub]); // cap 10

      try {
        const res = await fetch(
          `/api/documents/v2/documents/${encodeURIComponent(docId)}/audit-change`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              edited_block_id: detail.edited_block_id,
              before_block_data: detail.before_block_data,
              user_instruction: detail.user_instruction || "",
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAudits((prev) =>
          prev.map((a) =>
            a.id === auditId
              ? {
                  ...a,
                  loading: false,
                  coherence_score: data.coherence_score ?? 1.0,
                  summary: data.summary ?? "",
                  findings: Array.isArray(data.findings) ? data.findings : [],
                }
              : a
          )
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setAudits((prev) =>
          prev.map((a) =>
            a.id === auditId ? { ...a, loading: false, error: msg } : a
          )
        );
      }
    };
    window.addEventListener("lexai:doc-changed", handler as EventListener);
    return () => {
      window.removeEventListener("lexai:doc-changed", handler as EventListener);
    };
  }, []);

  return { audits, enabled, setEnabled, dismissAudit, clearAll };
}
