'use client';

/**
 * Error boundary local para /v2/canvas/draft.
 * Captura excepciones del IntegratedGenerationCanvas y muestra
 * stack + opciones de recovery en vez de pantalla blanca.
 */

import { useEffect } from 'react';

export default function CanvasDraftError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log al servidor + a console para debugging
    // eslint-disable-next-line no-console
    console.error('[canvas/draft] client-side crash:', error);
  }, [error]);

  return (
    <div style={{
      padding: 32,
      maxWidth: 900,
      margin: '40px auto',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: 1.5,
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#991B1B', marginBottom: 8 }}>
        Error al renderizar el canvas
      </h1>
      <p style={{ color: '#525252', marginBottom: 16, fontSize: 14 }}>
        Un componente del canvas falló al inicializarse. Esto suele ser un dato corrupto en
        localStorage o una respuesta inesperada del backend. Usa los botones para recuperarte.
      </p>

      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', marginBottom: 6 }}>
          {error.name}: {error.message}
        </div>
        {error.digest && (
          <div style={{ fontSize: 11, color: '#7F1D1D', marginBottom: 8 }}>
            digest: {error.digest}
          </div>
        )}
        <pre style={{
          fontSize: 11,
          fontFamily: 'monospace',
          background: 'white',
          padding: 12,
          borderRadius: 4,
          overflow: 'auto',
          maxHeight: 320,
          color: '#1F2937',
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}>
          {error.stack || '(sin stack)'}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '8px 16px',
            background: '#1F2937',
            color: 'white',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Reintentar
        </button>
        <button
          onClick={() => {
            try {
              const keys = Object.keys(localStorage);
              const lexaiKeys = keys.filter((k) => k.startsWith('lexai-'));
              lexaiKeys.forEach((k) => localStorage.removeItem(k));
              // eslint-disable-next-line no-alert
              alert(`Limpiados ${lexaiKeys.length} keys de localStorage. Recargando.`);
              window.location.reload();
            } catch (e) {
              // eslint-disable-next-line no-alert
              alert('Error al limpiar localStorage: ' + String(e));
            }
          }}
          style={{
            padding: '8px 16px',
            background: 'white',
            color: '#1F2937',
            borderRadius: 6,
            border: '1px solid #D4D4D8',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Limpiar caché local + recargar
        </button>
        <a
          href="/v2/inicio"
          style={{
            padding: '8px 16px',
            background: 'white',
            color: '#1F2937',
            borderRadius: 6,
            border: '1px solid #D4D4D8',
            textDecoration: 'none',
            fontSize: 13,
            display: 'inline-block',
          }}
        >
          Volver a inicio
        </a>
      </div>

      <details style={{ marginTop: 16, fontSize: 12, color: '#525252' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
          Información del entorno (para debugging)
        </summary>
        <pre style={{
          fontSize: 10,
          fontFamily: 'monospace',
          background: '#F9FAFB',
          padding: 8,
          borderRadius: 4,
          marginTop: 8,
          overflow: 'auto',
        }}>
{`URL: ${typeof window !== 'undefined' ? window.location.href : 'n/a'}
UserAgent: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'n/a'}
Timestamp: ${new Date().toISOString()}`}
        </pre>
      </details>
    </div>
  );
}
