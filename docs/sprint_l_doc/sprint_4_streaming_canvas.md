# Sprint 4: Streaming Visual en Canvas

**Duracion:** 1 semana
**Estado:** Pendiente frontend

## Objetivos

Las secciones del documento aparecen en TipTap canvas en vivo, con estados visuales (pending/streaming/complete/verified) y controles por seccion.

## Migracion SQL

```sql
-- Migration: M6_section_revisions.sql

CREATE TABLE IF NOT EXISTS document_section_revisions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id      uuid REFERENCES generated_document_sections(id) ON DELETE CASCADE,
    firm_id         uuid REFERENCES firms(id) ON DELETE CASCADE,
    user_id         uuid REFERENCES users(id) ON DELETE SET NULL,
    content_md      text,
    revision_type   text CHECK (revision_type IN (
        'agent_draft', 'user_edit', 'agent_regenerate',
        'user_accept', 'user_revert'
    )),
    delta_chars     integer,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX section_revisions_section_ts_idx
    ON document_section_revisions (section_id, created_at DESC);

ALTER TABLE document_section_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "section_revisions_tenant_isolation"
    ON document_section_revisions FOR ALL
    USING (firm_id = auth.jwt_firm_id());
```

## Componentes frontend a crear

| Componente | Proposito |
|---|---|
| `SectionBlock.tsx` | TipTap node extension custom con estados |
| `DocumentStreamingCanvas.tsx` | Wrapper TipTap + manejo sectionPositions |
| `TableOfContents.tsx` | TOC sticky con progress + scroll spy |
| `StreamingProgressBar.tsx` | Barra de progreso en thread (8/N) |
| `SectionActions.tsx` | Toolbar flotante regenerar/editar/lock |
| `CheckpointBadge.tsx` | Badge "Guardado hace Xs / Revertir" |
| `SectionDiff.tsx` | Diff visual con TipTap highlight marks |

## Estados visuales por seccion

```
pending      → borde dashed, opacity 0.45, icono Reloj gris
streaming    → borde 3px navy, fondo navy 4%, spinner copper
complete     → borde 1px subtle, CheckCircle gris
verified     → borde emerald-500/30, badge "Verificada"
regenerating → borde 3px copper, spinner copper, badge "Regenerando"
error        → borde 3px red, badge "Error"
locked       → borde copper, icono Lock, badge "Protegida"
```

## Sistema de checkpoints

```typescript
// lib/v2/document-gen/checkpointManager.ts

interface Checkpoint {
  docId: string;
  timestamp: number;
  triggerReason: 'pre_regenerate' | 'pre_replace' | 'manual';
  contentJson: object; // TipTap JSON
}

class CheckpointManager {
  private static MAX_PER_DOC = 10;
  private static keyFor(docId: string) {
    return `lexai-v2-canvas-checkpoints:${docId}`;
  }

  static save(docId: string, content: object, reason: Checkpoint['triggerReason']) {
    const list = this.read(docId);
    list.unshift({ docId, timestamp: Date.now(), triggerReason: reason, contentJson: content });
    const trimmed = list.slice(0, this.MAX_PER_DOC);
    localStorage.setItem(this.keyFor(docId), JSON.stringify(trimmed));
  }

  static read(docId: string): Checkpoint[] {
    try {
      const raw = localStorage.getItem(this.keyFor(docId));
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  static restore(docId: string, timestamp: number): Checkpoint | null {
    return this.read(docId).find(c => c.timestamp === timestamp) ?? null;
  }
}
```

## Anti-perdida de edits del usuario

```typescript
// uiCommandBus intercepta canvas_replace_section
uiCommandBus.intercept('canvas_replace_section', async (cmd) => {
  const section = getSectionState(cmd.section_key);

  if (section?.user_edited) {
    const confirmed = await showConfirmDialog({
      title: `LexAI quiere modificar "${section.title}"`,
      body: 'Esta seccion fue editada por usted manualmente. Permitir?',
      actions: ['Permitir', 'Denegar', 'Ver diferencias']
    });
    if (confirmed === 'Denegar') return false;
  }

  // Crear checkpoint ANTES de aplicar
  CheckpointManager.save(cmd.doc_id, getEditorJson(), 'pre_replace');

  return true; // proceder con comando
});
```

## DONE criteria

- [ ] 7 componentes nuevos implementados
- [ ] Migracion M6 aplicada
- [ ] Streaming visible seccion por seccion en canvas
- [ ] Badges de calidad por seccion (green/amber/red)
- [ ] Checkpoint + revert funciona
- [ ] Edits manuales nunca se pierden
- [ ] Suite regresion pasa (canvas casos, voice, etc.)
