'use client';

/**
 * F5-T01 · LexAI UX v2 — ThreadCanvasSplit
 *
 * Split view horizontal:
 *   Panel izquierdo (default 38%): thread + composer (ComposerV2WithStream)
 *   Panel derecho (default 62%):  CanvasV2
 *
 * Usa react-resizable-panels (PanelGroup + Panel + PanelResizeHandle).
 * Persiste el ratio en localStorage bajo la clave `lexai-v2-canvas-split`.
 *
 * Props:
 *   matterId       — ID del caso
 *   docId          — ID del matter_document
 *   initialContent — HTML inicial del documento
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { ComposerV2WithStream } from '@/components/v2/composer/ComposerV2WithStream';
import { CanvasV2 } from './CanvasV2';
import { AgentEditingChip } from './AgentEditingChip';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThreadCanvasSplitProps {
  matterId: string;
  docId: string;
  initialContent?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'lexai-v2-canvas-split';
const DEFAULT_LEFT = 38;
const DEFAULT_RIGHT = 62;
const MIN_SIZE = 20;

// ─── ThreadPanel ──────────────────────────────────────────────────────────────

function ThreadPanel({
  matterId,
  docId,
  isAgentEditing,
  agentDescription,
}: {
  matterId: string;
  docId: string;
  isAgentEditing: boolean;
  agentDescription?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
        borderRight: '1px solid var(--v2-border-default, #DDDBD3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--v2-border-default, #DDDBD3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--v2-text-secondary, #5A5850)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Conversacion
        </span>
        {/* Chip de agente editando */}
        <AgentEditingChip isEditing={isAgentEditing} description={agentDescription} />
      </div>

      {/* Thread + Composer */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ComposerV2WithStream
          matterId={matterId}
          activeTab="canvas"
          placeholder="Pregúntale a LexAI sobre este documento…"
          className="h-full"
        />
      </div>
    </div>
  );
}

// ─── ThreadCanvasSplit ────────────────────────────────────────────────────────

export function ThreadCanvasSplit({
  matterId,
  docId,
  initialContent = '',
}: ThreadCanvasSplitProps) {
  // Persiste el ratio del split en localStorage
  const [defaultLeft, setDefaultLeft] = useState<number>(DEFAULT_LEFT);
  const [isAgentEditing, setIsAgentEditing] = useState(false);
  const [agentDescription, setAgentDescription] = useState<string | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!Number.isNaN(val) && val >= MIN_SIZE && val <= 100 - MIN_SIZE) {
          setDefaultLeft(val);
        }
      }
    } catch {
      /* noop */
    }
  }, []);

  const handleLayout = useCallback((layout: Record<string, number>) => {
    const left = layout['thread'];
    if (typeof left !== 'number') return;
    try {
      localStorage.setItem(LS_KEY, String(Math.round(left)));
    } catch {
      /* noop */
    }
  }, []);

  // Escuchar uiCommandBus para detectar cuando el agente está editando el canvas
  useEffect(() => {
    const markEditing = () => {
      setIsAgentEditing(true);
      return false; // no consume el comando — deja que el CanvasEditor lo procese
    };
    const markDone = () => {
      setIsAgentEditing(false);
      return false;
    };

    const u1 = uiCommandBus.register('canvas_set_text', markEditing);
    const u2 = uiCommandBus.register('canvas_append', markEditing);
    const u3 = uiCommandBus.register('canvas_replace_section', markEditing);
    const u4 = uiCommandBus.register('canvas_save_version', markDone);

    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  return (
    <PanelGroup
      orientation="horizontal"
      onLayoutChanged={handleLayout}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Panel izquierdo: Thread */}
      <Panel
        defaultSize={defaultLeft}
        minSize={MIN_SIZE}
        id="thread"
      >
        <ThreadPanel
          matterId={matterId}
          docId={docId}
          isAgentEditing={isAgentEditing}
          agentDescription={agentDescription}
        />
      </Panel>

      {/* Resize handle */}
      <PanelResizeHandle
        style={{
          width: 4,
          cursor: 'col-resize',
          backgroundColor: 'var(--v2-border-default, #DDDBD3)',
          transition: 'background-color 150ms, width 150ms',
          flexShrink: 0,
          zIndex: 10,
        }}
      />

      {/* Panel derecho: Canvas */}
      <Panel
        defaultSize={DEFAULT_RIGHT}
        minSize={MIN_SIZE}
        id="canvas"
      >
        <CanvasV2
          docId={docId}
          initialContent={initialContent}
          matterId={matterId}
          readonly={false}
        />
      </Panel>
    </PanelGroup>
  );
}
