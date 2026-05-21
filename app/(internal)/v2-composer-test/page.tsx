'use client';

/**
 * F3 · Test page — ComposerV2
 *
 * Página de prueba para el Composer v2 (sin afectar producción).
 * Acceso: http://localhost:3000/v2-composer-test
 *
 * Activa con NEXT_PUBLIC_UX_V2_COMPOSER=true en .env.local
 * (el componente se monta incondicionalmente en esta página de test).
 */

import { ComposerV2WithStream } from '@/components/v2/composer/ComposerV2WithStream';
import { ComposerV2 } from '@/components/v2/composer/ComposerV2';
import { AttachmentChip } from '@/components/v2/composer/AttachmentChip';
import { ModelSelector } from '@/components/v2/composer/ModelSelector';
import { useState } from 'react';
import type { ComposerPayload } from '@/components/v2/composer/ComposerV2';

export default function V2ComposerTestPage() {
  const [lastPayload, setLastPayload] = useState<ComposerPayload | null>(null);
  const flagEnabled = process.env.NEXT_PUBLIC_UX_V2_COMPOSER === 'true';

  return (
    <div
      className="min-h-screen bg-[color:var(--v2-bg-base,#FAFAF7)] p-8"
      data-v2-tokens
    >
      <div className="mx-auto max-w-3xl space-y-10">

        {/* Header */}
        <div>
          <h1
            className="text-2xl font-semibold text-[color:var(--v2-text-primary,#1A1916)] mb-1"
            style={{ fontFamily: 'var(--v2-font-sans, system-ui)' }}
          >
            ComposerV2 — Prueba F3
          </h1>
          <p className="text-[14px] text-[color:var(--v2-text-secondary,#4A4944)]">
            Flag <code className="text-xs bg-gray-100 px-1 rounded">NEXT_PUBLIC_UX_V2_COMPOSER</code>:{' '}
            <span className={flagEnabled ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
              {flagEnabled ? 'true (activo)' : 'false / no definido (test irrestricto aquí)'}
            </span>
          </p>
        </div>

        {/* ── Sección 1: ComposerV2WithStream (full experience) ── */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[color:var(--v2-text-tertiary,#7A7870)] mb-4">
            1 — ComposerV2WithStream (thread real con SSE)
          </h2>
          <p className="text-[13px] text-[color:var(--v2-text-secondary,#4A4944)] mb-4">
            Escribe un prompt y presiona Enter. Si el backend está disponible, verás
            streaming token a token con cursor parpadeante. Si no hay conexión, verás
            el error manejado con toast.
          </p>
          <div
            className="rounded-2xl border border-[color:var(--v2-border-subtle,#E8E6DF)] bg-white overflow-hidden"
            style={{ height: '500px' }}
          >
            <ComposerV2WithStream
              autoFocus
              placeholder="Pregúntale algo a LexAI (p.ej. ¿cuáles son mis plazos hoy?)"
              initialMessages={[
                {
                  id: 'init-1',
                  role: 'assistant',
                  content: 'Buenos días. Estoy listo para ayudarle con sus consultas legales. Puede preguntarme sobre sus casos, plazos, jurisprudencia o usar cualquier /skill disponible.',
                },
              ]}
            />
          </div>
        </section>

        {/* ── Sección 2: ComposerV2 standalone (onSend → log) ── */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[color:var(--v2-text-tertiary,#7A7870)] mb-4">
            2 — ComposerV2 standalone (sin stream, solo payload)
          </h2>
          <p className="text-[13px] text-[color:var(--v2-text-secondary,#4A4944)] mb-4">
            Prueba el menú +, adjuntos, selector de modelo, voz. El payload se
            muestra abajo en lugar de enviarse al backend.
          </p>
          <ComposerV2
            placeholder="Escribe aquí para ver el payload generado..."
            onSend={(payload) => {
              setLastPayload(payload);
              console.log('[ComposerV2Test] payload:', payload);
            }}
          />
          {lastPayload && (
            <details className="mt-4">
              <summary className="text-[12px] font-medium cursor-pointer text-[color:var(--v2-text-secondary,#4A4944)] hover:text-[color:var(--v2-text-primary,#1A1916)]">
                Payload enviado (click para ver)
              </summary>
              <pre className="mt-2 rounded-xl bg-slate-900 text-green-300 text-[11px] p-4 overflow-auto max-h-64">
                {JSON.stringify(lastPayload, null, 2)}
              </pre>
            </details>
          )}
        </section>

        {/* ── Sección 3: AttachmentChip todas las variantes ── */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[color:var(--v2-text-tertiary,#7A7870)] mb-4">
            3 — AttachmentChip (variantes)
          </h2>
          <div className="flex flex-wrap gap-2">
            <AttachmentChip
              attachment={{ id: 'a1', type: 'matter', label: 'Pérez vs López' }}
              onRemove={() => {}}
            />
            <AttachmentChip
              attachment={{ id: 'a2', type: 'party', label: 'Juan García' }}
              onRemove={() => {}}
            />
            <AttachmentChip
              attachment={{ id: 'a3', type: 'judge', label: 'Dr. Hernández' }}
              onRemove={() => {}}
            />
            <AttachmentChip
              attachment={{ id: 'a4', type: 'deadline', label: 'Traslado 23 may' }}
              onRemove={() => {}}
            />
            <AttachmentChip
              attachment={{ id: 'a5', type: 'doc', label: 'tutela_final_v3.pdf' }}
              onRemove={() => {}}
            />
            <AttachmentChip
              attachment={{ id: 'a6', type: 'skill', label: '/redactar/tutela' }}
              onRemove={() => {}}
            />
            <AttachmentChip
              attachment={{ id: 'a7', type: 'connector', label: 'DIAN' }}
              onRemove={() => {}}
            />
          </div>
        </section>

        {/* ── Sección 4: ModelSelector ── */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-[color:var(--v2-text-tertiary,#7A7870)] mb-4">
            4 — ModelSelector
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-[color:var(--v2-text-secondary,#4A4944)]">
              Modelo activo:
            </span>
            <ModelSelector onChangeModel={(m) => console.log('[ModelSelector] cambió a:', m)} />
          </div>
          <p className="mt-2 text-[12px] text-[color:var(--v2-text-tertiary,#7A7870)]">
            La selección persiste en localStorage key{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">lexai-v2-composer-model</code>
          </p>
        </section>

        {/* ── Footer ── */}
        <div className="pt-4 border-t border-[color:var(--v2-border-subtle,#E8E6DF)] text-[12px] text-[color:var(--v2-text-tertiary,#7A7870)]">
          FASE 3 — LexAI UX v2 · Solo desarrollo ·{' '}
          <a href="/v2-showcase" className="underline hover:text-[color:var(--v2-text-primary,#1A1916)]">
            Ver showcase tokens
          </a>
        </div>
      </div>
    </div>
  );
}
