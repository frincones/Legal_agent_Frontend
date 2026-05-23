# Sprint 0: Setup Infrastructure + Pipeline UI

**Duracion:** 3-5 dias
**Estado:** Frontend completo, backend pendiente

## Objetivos

1. Cuentas y credenciales (Cloudflare R2, Hugging Face, OpenAI, Helicone, Sentry)
2. Feature flags en env vars (todos OFF default)
3. Modulo admin `/admin/pipeline` con dashboard realtime
4. Endpoints stub que devuelven mocked data

## Entregables frontend (COMPLETADO 2026-05-23)

### Estructura de archivos

```
lib/admin/pipeline/
  types.ts                  - Tipos compartidos
  mockData.ts               - Mocked data realista
  useAutoRefresh.ts         - Hook polling + visibility API

components/admin/pipeline/
  PipelineDashboard.tsx     - Master dashboard con tabs
  RealtimeStatusBadge.tsx   - Badge healthy/degraded/critical
  GlobalMetricsCards.tsx    - Grid 8 cards (workers, jobs, storage, costos)
  SourcesGrid.tsx           - Grid de SourceCards con filtros
  SourceCard.tsx            - Card individual por fuente
  InventoryStats.tsx        - Totales + storage gauges + tabla
  RunningJobsTable.tsx      - Workers ejecutando
  CronJobsTable.tsx         - Cronjobs APScheduler
  LogsViewer.tsx            - Stream logs con filtros

app/(app)/admin/pipeline/
  page.tsx                  - /admin/pipeline montaje

app/api/admin/pipeline/
  status/route.ts           - Estado global
  sources/route.ts          - Progreso por fuente
  inventory/route.ts        - Inventario completo
  jobs/route.ts             - Workers + cronjobs
  logs/route.ts             - Logs con filtros

lib/v2/document-gen/
  intentDetector.ts         - Heuristica keywords
  useDocumentGenStream.ts   - Hook SSE consumer

components/v2/document-gen/
  InlineParamsForm.tsx      - Form embebido burbuja

app/api/documents/
  generate/route.ts         - Proxy SSE backend (feature-flagged)
```

## Entregables backend (PENDIENTE - otro repo)

### Cuentas a crear

1. **Cloudflare** - crear cuenta + activar R2 free tier
   - Crear bucket `lexai-corpus`
   - Generar API token con permisos R2
   - Configurar lifecycle rules:
     - tag `lazy-cache` -> expire 90 dias
     - tag `curated` -> keep forever
   - Obtener `R2_ENDPOINT_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `CLOUDFLARE_ACCOUNT_ID`

2. **Hugging Face** - crear cuenta + dataset privado
   - Dataset repo: `lexai-corpus-co` (privado inicialmente)
   - Generar token con permisos write al dataset
   - `HUGGINGFACE_TOKEN`, `HF_DATASET_REPO`

3. **Helicone** - free tier 10K req/mes
   - `HELICONE_API_KEY`
   - Configurar como proxy frente a OpenAI

4. **Sentry** - free tier 5K events/mes
   - Project: `lexai-ingest`
   - `SENTRY_DSN_INGEST`

### Endpoints backend a implementar

Schema esperado por los endpoints proxy del frontend:

#### GET /admin/pipeline/status

```json
{
  "health": "healthy",
  "active_workers": 3,
  "total_workers": 5,
  "jobs_queued": 24500,
  "jobs_running": 5,
  "jobs_failed_last_24h": 12,
  "docs_ingested_today": 8240,
  "docs_ingested_last_24h": 11200,
  "storage": {
    "postgres_pct": 31.2,
    "r2_pct": 8.4
  },
  "cost_today_usd": 4.12,
  "cost_month_usd": 38.7
}
```

#### GET /admin/pipeline/sources

Array de objetos `SourceStats` (ver `lib/admin/pipeline/types.ts`).

#### GET /admin/pipeline/inventory

Objeto `InventorySummary` con totales + by_source array.

#### GET /admin/pipeline/jobs

```json
{
  "running": [/* RunningJob[] */],
  "cron": [/* CronJob[] */]
}
```

#### GET /admin/pipeline/logs

Array de `PipelineLogEntry`. Soporta query params: `?level=info|warn|error&source=corte_cc&limit=200`.

### Auth backend

Validar JWT Supabase y check de admin role:
```python
def require_admin(token: str = Depends(get_jwt_token)):
    claims = decode_jwt(token)
    if not claims.get("role") == "admin":
        raise HTTPException(403, "admin_only")
    return claims
```

## Validacion

```bash
# Frontend
cd Legal_agent_Frontend
npx tsc --noEmit  # debe pasar limpio
npm run dev
# Navegar a http://localhost:3000/admin/pipeline
# Verificar UI con mocked data (backend offline)

# Cuando backend este listo:
export MOCK_PIPELINE=false  # o no setearlo
# Recargar UI -> deberia consumir backend real
```

## DONE criteria

- [x] Frontend modulo `/admin/pipeline` accesible
- [x] Mocked data realista funciona si backend offline
- [x] Auto-refresh + visibility API
- [x] Feature flags definidos en `.env.local.example`
- [ ] Cuentas Cloudflare R2, HF, Helicone, Sentry creadas
- [ ] Backend implementa 5 endpoints admin
- [ ] Backend valida admin role en JWT

## Riesgos identificados

| # | Riesgo | Mitigacion |
|---|---|---|
| 1 | Endpoint `/admin/pipeline/*` no protegido por admin role | Implementar check obligatorio en backend |
| 2 | Mocked data quedar en produccion por error | `MOCK_PIPELINE` solo activable en dev |
| 3 | Auto-refresh consume cuota backend si tab abierta | `visibilitychange` pausa polling |
