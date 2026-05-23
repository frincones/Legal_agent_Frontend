# Sprint L-DOC: Document Generation V2

**Codename:** L-DOC
**Estado:** Plan aprobado, implementacion frontend en progreso, backend pendiente.

## Vision

Sistema de generacion de documentos legales colombianos en tiempo real con streaming en canvas, alimentado por corpus de ~540K documentos curados de fuentes oficiales gratuitas, sobre arquitectura "Compound AI System" con OpenAI economy tier (GPT-4o-mini, text-embedding-3-small, o3-mini).

## Stack tecnico

| Componente | Tecnologia | Costo |
|---|---|---|
| LLM drafting | OpenAI gpt-4o-mini | $0.15/1M in, $0.60/1M out |
| LLM router/extractor | OpenAI gpt-4o-mini | (mismo) |
| LLM judge/critic | OpenAI o3-mini | $1.10/1M in, $4.40/1M out |
| Embeddings | OpenAI text-embedding-3-small | $0.02/1M tokens |
| Object storage | Cloudflare R2 | Free 10 GB + 0 egress |
| Vector DB | pgvector binary quantization | Free (Supabase) |
| Backup | Hugging Face Datasets | Free ilimitado |
| Observability | Helicone + Sentry | Free tiers |
| Scheduler | APScheduler (Railway worker) | Free credit Railway |

## Sprints

- [SPRINT 0: Setup + Pipeline UI](./sprint_0_setup.md)
- [SPRINT 1: Quick wins ingest + R2](./sprint_1_quickwins.md)
- [SPRINT 2: Corte CC bulk + binary embeddings](./sprint_2_corte_cc.md)
- [SPRINT 3: Endpoint /v1/documents/generate MVP](./sprint_3_documents_endpoint.md)
- [SPRINT 4: Streaming visual canvas](./sprint_4_streaming_canvas.md)
- [SPRINT 5: Verifier + scorecard + quality](./sprint_5_verifier_scorecard.md)
- [SPRINT 6: Cortes altas + validacion final](./sprint_6_cortes_altas.md)

## Estado actual (2026-05-23)

### Completado en frontend
- Modulo admin `/admin/pipeline` con dashboard realtime
- Endpoints proxy Next.js con fallback a mocked data
- Componentes: PipelineDashboard, SourcesGrid, InventoryStats, RunningJobsTable, CronJobsTable, LogsViewer
- Hook useAutoRefresh con visibility API
- Hook useDocumentGenStream + InlineParamsForm + intentDetector
- Endpoint `/api/documents/generate` proxy con feature flag

### Pendiente en backend (otro repo)
- Endpoints `/admin/pipeline/{status,sources,inventory,jobs,logs}`
- Endpoint `/v1/documents/generate` con SSE
- Pipeline stream-only (`backend/ingestion/`)
- 17 scrapers por fuente
- Migraciones SQL (template_sections_catalog, generated_document_sections, etc.)
- Worker APScheduler de ingesta
- Cloudflare R2 client
- Hugging Face backup nocturno

### Feature flags
Todos en OFF por default. Activacion progresiva:
- `NEXT_PUBLIC_DOC_GEN_V2_ENABLED` - activa el flow nuevo
- `NEXT_PUBLIC_DOC_STREAMING_CANVAS_ENABLED` - activa streaming en canvas
- `NEXT_PUBLIC_DOC_INLINE_PARAMS_FORM` - activa form inline
- `NEXT_PUBLIC_DOC_CITATION_BADGES_INLINE` - badges inline
- `BACKEND_USE_BINARY_EMBEDDINGS` - usa binary quant
- `BACKEND_USE_SEMANTIC_CACHE` - cache semantico
- `BACKEND_USE_SELF_CRITIQUE_LOOP` - loop critic
- `INGEST_WORKER_ENABLED` - worker de ingesta corriendo

## Como probar el modulo Pipeline UI HOY

1. `cd Legal_agent_Frontend && npm run dev`
2. Navegar a `http://localhost:3000/admin/pipeline`
3. Si backend Railway no esta corriendo, el dashboard usa mocked data realista
4. Verificar:
   - Estado global aparece con metricas
   - Tab Fuentes: grid con 17 fuentes y progress bars
   - Tab Workers: workers corriendo + cronjobs programados
   - Tab Inventario: storage gauges + tabla por source
   - Tab Logs: stream con filtros por nivel
   - Auto-refresh cada 5-30s (pausa cuando tab no visible)

## Costo total proyectado

- One-shot ingest corpus completo: ~$170 USD
- Operacion recurrente: $5-10 USD/mes
- Infraestructura: $0 (all free tiers)
