'use client';

/**
 * F5-T04 · LexAI UX v2 — VerifyCitationsResult
 *
 * Panel lateral (drawer) que abre cuando el usuario invoca "Verificar citas".
 * Extrae citas del texto del canvas, llama /api/citations/verify y muestra
 * cada cita con su estado: válida / derogada / no encontrada (sospechosa).
 *
 * Usa @radix-ui/react-dialog implementado como sheet lateral derecho.
 * Botón "Saltar a cita" llama al editor a través de la referencia.
 */

import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ScanLine, ExternalLink, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CitationResult {
  citation_ref: string;
  estado: 'verificada' | 'no_encontrada' | 'superada' | 'sospechosa' | string;
  juris_id?: string | null;
  corte?: string | null;
  rubro?: string | null;
  vigencia?: string | null;
  url_oficial?: string | null;
}

export interface VerifyCitationsResultProps {
  open: boolean;
  onClose: () => void;
  /** Texto del canvas del que se extraen las citas */
  canvasText: string;
  /** Función opcional para hacer scroll a una cita en el editor */
  onJumpToCitation?: (ref: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae referencias de citas colombianas del texto plano. */
function extractCitationRefs(text: string): string[] {
  const patterns = [
    /[TCSUu][- ]\d+[\/-]\d{4}/g,          // T-329/1997, C-200/1995, SU-123/2001
    /S[LCP]-\d{4,6}-\d{4}/g,              // SL-12345-2024, SC-1234-2022
    /LEY\s+\d+\s*(?:DE\s+)?\d{4}/gi,     // LEY 100 DE 1993
    /DECRETO\s+\d+\s*(?:DE\s+)?\d{4}/gi, // DECRETO 2591 DE 1991
    /Art(?:ículo)?\.\s*\d+/gi,            // Art. 86 (skip — demasiado genérico)
  ];
  const refs = new Set<string>();
  for (let i = 0; i < patterns.length - 1; i++) {
    const matches = text.match(patterns[i]!);
    if (matches) matches.forEach((m) => refs.add(m.trim()));
  }
  return Array.from(refs).slice(0, 20); // max 20
}

// ─── Status display ───────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    verificada: {
      icon: <CheckCircle2 size={12} />,
      label: 'Válida',
      color: '#15803d',
      bg: '#dcfce7',
    },
    superada: {
      icon: <AlertTriangle size={12} />,
      label: 'Derogada',
      color: '#b45309',
      bg: '#fef3c7',
    },
    no_encontrada: {
      icon: <HelpCircle size={12} />,
      label: 'No encontrada',
      color: '#6b7280',
      bg: '#f3f4f6',
    },
    sospechosa: {
      icon: <AlertTriangle size={12} />,
      label: 'Inventada',
      color: '#dc2626',
      bg: '#fee2e2',
    },
  };
  const cfg = map[estado] ?? map['no_encontrada']!;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 10,
        color: cfg.color,
        backgroundColor: cfg.bg,
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── VerifyCitationsResult ────────────────────────────────────────────────────

export function VerifyCitationsResult({
  open,
  onClose,
  canvasText,
  onJumpToCitation,
}: VerifyCitationsResultProps) {
  const [results, setResults] = useState<CitationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refs, setRefs] = useState<string[]>([]);
  const fetchedRef = useRef(false);

  // Extraer y verificar cuando abre
  useEffect(() => {
    if (!open) {
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const extracted = extractCitationRefs(canvasText);
    setRefs(extracted);

    if (extracted.length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch('/api/citations/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ citation_refs: extracted }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        return res.json() as Promise<CitationResult[]>;
      })
      .then((data) => {
        setResults(data);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Error verificando citas');
      })
      .finally(() => setLoading(false));
  }, [open, canvasText]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        {/* Overlay suave */}
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.15)',
            zIndex: 150,
          }}
        />

        {/* Sheet lateral derecho */}
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 360,
            zIndex: 151,
            backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
            borderLeft: '1px solid var(--v2-border-default, #DDDBD3)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
            outline: 'none',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 16px',
              borderBottom: '1px solid var(--v2-border-default, #DDDBD3)',
            }}
          >
            <ScanLine size={16} style={{ color: 'var(--v2-accent-copper, #B8763C)' }} />
            <Dialog.Title
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--v2-text-primary, #1A1916)',
                flex: 1,
              }}
            >
              Verificación de citas
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--v2-text-secondary, #5A5850)',
                }}
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Cuerpo scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {loading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--v2-text-tertiary, #7A7870)',
                  fontSize: 13,
                }}
              >
                Verificando {refs.length} cita{refs.length !== 1 ? 's' : ''}...
              </div>
            )}

            {!loading && error && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {!loading && !error && refs.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--v2-text-tertiary, #7A7870)',
                  fontSize: 13,
                }}
              >
                No se detectaron citas jurisprudenciales en el documento.
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-text-tertiary, #7A7870)',
                    marginBottom: 4,
                  }}
                >
                  {results.length} cita{results.length !== 1 ? 's' : ''} verificada{results.length !== 1 ? 's' : ''}
                </p>

                {results.map((r) => (
                  <div
                    key={r.citation_ref}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--v2-border-default, #DDDBD3)',
                      backgroundColor: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {/* Referencia + status */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--v2-text-primary, #1A1916)',
                        }}
                      >
                        {r.citation_ref}
                      </span>
                      <StatusBadge estado={r.estado} />
                    </div>

                    {/* Rubro */}
                    {r.rubro && (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--v2-text-secondary, #5A5850)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {r.rubro}
                      </p>
                    )}

                    {/* Corte + vigencia */}
                    {(r.corte || r.vigencia) && (
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--v2-text-tertiary, #7A7870)',
                          margin: 0,
                        }}
                      >
                        {[r.corte?.replace(/_/g, ' '), r.vigencia].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      {onJumpToCitation && (
                        <button
                          type="button"
                          onClick={() => onJumpToCitation(r.citation_ref)}
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--v2-border-default, #DDDBD3)',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--v2-text-secondary, #5A5850)',
                          }}
                        >
                          Saltar a cita
                        </button>
                      )}
                      {r.url_oficial && (
                        <a
                          href={r.url_oficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--v2-accent-copper, #B8763C)',
                            color: 'var(--v2-accent-copper, #B8763C)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <ExternalLink size={10} />
                          Fuente oficial
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
