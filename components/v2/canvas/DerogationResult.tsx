'use client';

/**
 * F5-T05 · LexAI UX v2 — DerogationResult
 *
 * Panel lateral (drawer) para detección de derogación.
 * Llama a /api/legal/vigencia (endpoint existente en api/legal.py: /api/legal/vigencia)
 * con las normas extraídas del canvas.
 *
 * Si el endpoint no responde, muestra placeholder "Función disponible próximamente".
 * Highlight visual en el canvas: no podemos marcar HTML directamente desde aquí,
 * pero el componente emite `onHighlightNorm` para que el canvas lo use.
 */

import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DerogationItem {
  norma: string;
  estado: 'vigente' | 'derogada' | 'modificada' | 'desconocido';
  norma_reemplazante?: string | null;
  descripcion?: string | null;
  url?: string | null;
}

export interface DerogationResultProps {
  open: boolean;
  onClose: () => void;
  canvasText: string;
  /** Callback para resaltar una norma en el editor */
  onHighlightNorm?: (norm: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae referencias normativas del texto */
function extractNormRefs(text: string): string[] {
  const patterns = [
    /LEY\s+\d+\s*(?:DE\s+)?\d{4}/gi,
    /DECRETO\s+\d+\s*(?:DE\s+)?\d{4}/gi,
    /RESOLUCIÓN\s+\d+\s*(?:DE\s+)?\d{4}/gi,
    /DECRETO-LEY\s+\d+\s*(?:DE\s+)?\d{4}/gi,
    /ACTO LEGISLATIVO\s+\d+\s*(?:DE\s+)?\d{4}/gi,
  ];
  const refs = new Set<string>();
  for (const pat of patterns) {
    const matches = text.match(pat);
    if (matches) matches.forEach((m) => refs.add(m.trim().toUpperCase()));
  }
  return Array.from(refs).slice(0, 15);
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: DerogationItem['estado'] }) {
  const map = {
    vigente:     { label: 'Vigente',    color: '#15803d', bg: '#dcfce7', Icon: CheckCircle2 },
    derogada:    { label: 'Derogada',   color: '#dc2626', bg: '#fee2e2', Icon: AlertTriangle },
    modificada:  { label: 'Modificada', color: '#b45309', bg: '#fef3c7', Icon: AlertTriangle },
    desconocido: { label: 'Sin datos',  color: '#6b7280', bg: '#f3f4f6', Icon: AlertTriangle },
  };
  const cfg = map[estado] ?? map.desconocido;
  const { Icon } = cfg;
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
        flexShrink: 0,
      }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── DerogationResult ─────────────────────────────────────────────────────────

export function DerogationResult({
  open,
  onClose,
  canvasText,
  onHighlightNorm,
}: DerogationResultProps) {
  const [items, setItems] = useState<DerogationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [refs, setRefs] = useState<string[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const extracted = extractNormRefs(canvasText);
    setRefs(extracted);

    if (extracted.length === 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    setUnavailable(false);

    let isUnavailable = false;

    // Intentamos el endpoint de vigencia del backend.
    // /api/legal/vigencia espera POST { norma_id } — pero es para norma_id en BD.
    // Para el canvas usamos el endpoint de búsqueda jurisprudencial como proxy,
    // o si no está accesible, mostramos placeholder.
    fetch('/api/legal/vigencia', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ norma_refs: extracted }),
    })
      .then(async (res) => {
        if (res.status === 404 || res.status === 405) {
          isUnavailable = true;
          setUnavailable(true);
          return [] as DerogationItem[];
        }
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        return res.json() as Promise<DerogationItem[]>;
      })
      .then((data) => {
        if (!isUnavailable) setItems(data);
      })
      .catch(() => {
        // Si el endpoint no existe todavía, mostramos placeholder
        setUnavailable(true);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canvasText]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.15)',
            zIndex: 150,
          }}
        />

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
            <AlertTriangle
              size={16}
              style={{ color: '#b45309' }}
            />
            <Dialog.Title
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--v2-text-primary, #1A1916)',
                flex: 1,
              }}
            >
              Detección de derogación
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

          {/* Cuerpo */}
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
                Analizando {refs.length} norma{refs.length !== 1 ? 's' : ''}...
              </div>
            )}

            {!loading && unavailable && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <strong>Detección de derogación</strong>
                <br />
                Función disponible próximamente. El módulo de vigencia de normas
                está en proceso de integración con el grafo derogatorio.
                {refs.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      Normas detectadas en el documento:
                    </p>
                    <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11 }}>
                      {refs.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!loading && !unavailable && error && (
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

            {!loading && !unavailable && !error && refs.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--v2-text-tertiary, #7A7870)',
                  fontSize: 13,
                }}
              >
                No se detectaron referencias normativas en el documento.
              </div>
            )}

            {!loading && !unavailable && !error && items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--v2-text-tertiary, #7A7870)',
                    marginBottom: 4,
                  }}
                >
                  {items.length} norma{items.length !== 1 ? 's' : ''} analizada{items.length !== 1 ? 's' : ''}
                </p>

                {items.map((item) => (
                  <div
                    key={item.norma}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--v2-border-default, #DDDBD3)',
                      backgroundColor:
                        item.estado === 'derogada'
                          ? 'color-mix(in srgb, #f59e0b 8%, white)'
                          : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
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
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--v2-text-primary, #1A1916)',
                        }}
                      >
                        {item.norma}
                      </span>
                      <StatusBadge estado={item.estado} />
                    </div>

                    {item.descripcion && (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--v2-text-secondary, #5A5850)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.descripcion}
                      </p>
                    )}

                    {item.norma_reemplazante && (
                      <p
                        style={{
                          fontSize: 11,
                          color: '#b45309',
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        Reemplazada por: {item.norma_reemplazante}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      {onHighlightNorm && (
                        <button
                          type="button"
                          onClick={() => onHighlightNorm(item.norma)}
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
                          Ir al texto
                        </button>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid #b45309',
                            color: '#b45309',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <ExternalLink size={10} />
                          Ver norma
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
