# Sprint 3: Endpoint /v1/documents/generate MVP

**Duracion:** 1 semana
**Estado:** Frontend scaffolding listo, backend pendiente

## Objetivos

Primer flujo end-to-end de generacion de documento detras de feature flag.

## Migracion SQL

```sql
-- Migration: M5_generated_documents.sql

CREATE TABLE IF NOT EXISTS generated_document_sections (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id   uuid REFERENCES template_generations(id) ON DELETE CASCADE,
    firm_id         uuid REFERENCES firms(id) ON DELETE CASCADE,
    section_key     text NOT NULL,
    section_title   text NOT NULL,
    section_order   integer NOT NULL,
    content_md      text,
    stage           text CHECK (stage IN ('draft','critic','edit','final')),
    critic_score    numeric(3,2),
    critic_findings jsonb,
    citation_refs   text[],
    citation_status jsonb,
    streaming_done  boolean DEFAULT false,
    locked_by       uuid REFERENCES users(id) ON DELETE SET NULL,
    locked_at       timestamptz,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX gen_sections_generation_idx
    ON generated_document_sections (generation_id, section_order);

ALTER TABLE generated_document_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gen_sections_tenant_isolation"
    ON generated_document_sections FOR ALL
    USING (firm_id = auth.jwt_firm_id());

CREATE TABLE IF NOT EXISTS document_quality_scores (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_document_id  uuid REFERENCES matter_documents(id) ON DELETE CASCADE,
    firm_id             uuid REFERENCES firms(id) ON DELETE CASCADE,
    generation_id       uuid REFERENCES template_generations(id) ON DELETE SET NULL,
    judge_score         numeric(3,2),
    dimension_scores    jsonb,
    citation_rate       numeric(3,2),
    user_rating         integer CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback_md    text,
    computed_at         timestamptz DEFAULT now()
);

ALTER TABLE document_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_quality_tenant_isolation"
    ON document_quality_scores FOR ALL
    USING (firm_id = auth.jwt_firm_id());
```

## Endpoint POST /v1/documents/generate

### Request
```json
{
  "intent": "redacta una tutela por derecho a la salud",
  "user_brief": "Mi cliente Juan Perez tiene cancer y EPS Sanitas le nego quimio",
  "matter_id": "uuid|null",
  "materia": "salud|null",
  "doc_type": "tutela|null",
  "context": {}
}
```

### Response: text/event-stream

```
event: meta
data: {"generation_id":"...","template_selected":{...},"sections_plan":[...]}

event: section_started
data: {"section_key":"encabezado","section_title":"...","section_order":1,"total_sections":8}

event: section_delta
data: {"section_key":"encabezado","text":"Señor..."}

event: section_done
data: {"section_key":"encabezado","content_md":"...","critic_score":0.85,"citation_refs":[...]}

... (repeat por cada seccion)

event: verification_progress
data: {"checked":3,"total":6,"found":3,"suspicious":0}

event: verification_done
data: {"citation_rate":1.0,"verified":[...],"suspicious":[],"not_found":[]}

event: quality_score
data: {"judge_score":0.91,"dimensions":{...},"issues":[]}

event: done
data: {"generation_id":"...","matter_document_id":"...","total_seconds":29}
```

### Implementacion Python

```python
# backend/api/documents_generate.py

@router.post("/v1/documents/generate")
async def generate_document(req: GenerateRequest, claims = Depends(require_auth)):
    return StreamingResponse(
        stream_generation(req, claims['firm_id']),
        media_type='text/event-stream',
        headers={
            'X-Accel-Buffering': 'no',
            'Cache-Control': 'no-cache',
        }
    )

async def stream_generation(req: GenerateRequest, firm_id: str):
    keepalive_task = asyncio.create_task(_keepalive_ping())

    try:
        # Tool 1: classify intent
        decision = await classify_intent_llm(req.intent)
        yield format_sse('meta', {
            'generation_id': str(uuid4()),
            'template_selected': await retrieve_template(decision, firm_id),
            'sections_plan': decision.sections_plan
        })

        # Tool 2-4: para cada seccion
        async for event in document_generator.run(
            req=req,
            firm_id=firm_id,
            llm_router=get_llm_router(),  # gpt-4o-mini default
        ):
            yield format_sse(event.name, event.data)

        # Tool 5: verify citations batch
        async for event in verify_document_citations_batch(...):
            yield format_sse(event.name, event.data)

        # Tool 6: judge
        score = await judge_quality(...)
        yield format_sse('quality_score', score)

        yield format_sse('done', {...})
    finally:
        keepalive_task.cancel()

async def _keepalive_ping():
    while True:
        await asyncio.sleep(15)
        yield ': keepalive\n\n'
```

## Frontend scaffolding (COMPLETADO)

- `lib/v2/document-gen/intentDetector.ts` - heuristica keywords
- `lib/v2/document-gen/useDocumentGenStream.ts` - hook SSE consumer
- `components/v2/document-gen/InlineParamsForm.tsx` - form embebido
- `app/api/documents/generate/route.ts` - proxy con feature flag

### Integracion en ComposerV2WithStream (pendiente)

```typescript
// Pseudo: dentro de handleSend de ComposerV2WithStream
const intent = detectDocumentIntent(payload.input.prompt);

if (
  intent.isDocumentRequest
  && intent.confidence >= 0.85
  && process.env.NEXT_PUBLIC_DOC_GEN_V2_ENABLED === 'true'
) {
  // Navegar a canvas/draft con intent precargado
  router.push(`/v2/canvas/draft?intent=${encodeURIComponent(payload.input.prompt)}`);
  return; // NO ejecutar el flow chat normal
}

// Continuar con flow chat normal existente
```

## DONE criteria

- [ ] Migracion M5 aplicada
- [ ] Endpoint /v1/documents/generate funcional
- [ ] Flag OFF: 0 regresiones en chat normal
- [ ] Flag ON dev: genera doc end-to-end <30s
- [ ] Citation rate >85% en test set
- [ ] Costo por doc <$0.05

## Costo: ~$0.02 por documento generado (gpt-4o-mini)
