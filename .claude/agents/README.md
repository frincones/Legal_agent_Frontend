# SISTEMA DE AGENTES — LexAI (Legal Demo)

> Agentes especializados para construir, mantener y operar **LexAI**, un agente
> jurídico con RAG para Colombia. Cada agente conoce el monorepo, las rutas
> reales y las decisiones técnicas del producto.

---

## CONTEXTO COMPARTIDO (todos los agentes deben conocer esto)

### Producto

**LexAI** = agente legal AI multi-tenant para firmas/abogados colombianos. Funcionalidades clave:
- Investigación jurisprudencial (Corte Constitucional, Corte Suprema, Consejo de Estado, SUIN-Juriscol).
- Verificación de citas legales contra fuentes oficiales (anti-alucinación).
- Canvas TipTap colaborativo para redacción de escritos.
- Voice agent en tiempo real (OpenAI Realtime + 23 herramientas registradas).
- Casos / clientes / facturación / cartera / calendario / firmas digitales.
- Verificación catastral (IGAC + Catastro Bogotá) y centros de conciliación (SICAAC).
- Cálculo de prescripción, intereses, liquidación laboral, pensiones.
- Inbox legal (email + WhatsApp), notificaciones judiciales (Rama Judicial scraping).

### Repos

| Repo | Path local | Stack | Deploy |
|---|---|---|---|
| Frontend | `c:/Users/freddyrs/Desktop/Legal Demo/Legal_agent_Frontend` | Next.js 14.2 (App Router) + React 18 + TypeScript 5.7 + TipTap + Tailwind + Shadcn/Radix + TanStack Query | Vercel auto-deploy en `main` |
| Backend | `C:/Users/freddyrs/Desktop/Legal Demo Back/Legal_agent_backend/AgentRAGFullApp/backend` | FastAPI + Python 3.11 + asyncpg + httpx + OpenAI gpt-4o-mini + pgvector | Railway (`railway up --detach`) |

### Supabase (Postgres 15)

- `SUPABASE_REF`: `osyrwsbruydcyhdjvjpv`
- Tablas clave: `firms`, `users`, `matters`, `clients`, `documents`, `jurisprudencia` (36), `leyes_normas` (87,437), `gestores_catastrales` (1,121), `centros_conciliacion` (411), `verification_attempts`, `agent_traces`, `verification_attempts`, `external_fetch_cache`.
- Migraciones idempotentes en `AgentRAGFullApp/backend/storage/schemas/`.
- RLS multi-tenant por `firm_id`.

### Rutas frontend importantes

```
app/
├── (app)/               # área autenticada
│   ├── casos/           # matters CRUD
│   ├── clientes/        # clients
│   ├── canvas/          # editor TipTap colaborativo
│   ├── dashboard/       # KPIs
│   ├── facturacion/     # invoices
│   ├── jueces/          # judge predictions
│   ├── liquidacion/     # calc laboral
│   ├── menciones/       # inbox
│   └── ...
├── (auth)/              # login/registro
├── (onboarding)/        # firm setup
├── api/                 # 90+ proxies a Railway
│   ├── citations/verify/route.ts
│   ├── predios/verify/route.ts
│   ├── conciliacion/{search,verify}/route.ts
│   ├── canvas/...
│   └── ...
├── portal/[token]/      # client-portal token-based
└── tramites/            # trámites públicos
```

### Rutas backend importantes

```
AgentRAGFullApp/backend/
├── main.py                          # FastAPI + 120+ routers
├── api/                             # 115 archivos · cada uno un router
│   ├── citations.py                 # research + verify
│   ├── catastro_conciliacion.py     # /v1/predios + /v1/conciliacion (Sprint L8/L10)
│   ├── voice.py                     # Realtime WebSocket
│   ├── canvas_*.py                  # generation/transform/redlines/export
│   └── ...
├── legal_sources/                   # scrapers oficiales
│   ├── corte_constitucional.py
│   ├── senado_scraper.py
│   ├── datos_gov_co.py
│   ├── funcion_publica.py
│   ├── igac_source.py               # Sprint L8
│   └── web_search.py
├── utils/citation_verifier.py       # chain BD → live fetch
├── agent/                           # LangGraph-free orchestrator + tools
├── derogation/                      # graph vigencia + checker
├── ingestion/                       # embedder + chunkers
├── retrieval/                       # hybrid + reranker
├── scripts/                         # ingest_*.py + test_*.py
└── storage/schemas/                 # SQL migrations
```

### Convenciones críticas

- **Multi-tenant obligatorio**: toda query debe filtrar por `firm_id` (RLS lo enforza, pero el código debe ser explícito).
- **Citation Existence Rate = 100%**: ninguna respuesta del agente puede citar una sentencia/ley inexistente. Verificación obligatoria contra `leyes_normas` o `jurisprudencia`.
- **Auth cookie-based**: `@supabase/ssr` con session JWT forwardeado al backend via `Authorization: Bearer`.
- **Migraciones idempotentes**: solo `alter table ... if not exists`, `add column if not exists`. Nunca `drop`.
- **Sin emojis en código**: solo si el usuario lo pide explícito.
- **Sin secrets en Git**: `.env`, `.env.local` gitignored. GitHub secret scanning está activo.

### Reglas de despliegue

| Acción | Comando |
|---|---|
| Push frontend (auto-deploy Vercel) | `git push origin main` |
| Push backend (auto-deploy Railway) | `git push origin main` desde `Legal_agent_backend/` |
| Forzar deploy Railway sin push | `cd Legal_agent_backend && railway up --detach` |
| Aplicar migración Supabase | Management API: `POST /v1/projects/{ref}/database/query` con SUPABASE_ACCESS_TOKEN |

---

## AGENTES DISPONIBLES

| Agente | Especialización | Cuándo invocar |
|---|---|---|
| `coordinator` | Orquestación, priorización, gestión de sprints | Features grandes, planning, resolución de bloqueos |
| `arquitecto` | Guardián de arquitectura, decisiones técnicas, RLS | Diseño de tablas, contratos API, ADRs |
| `fullstack-dev` | Implementación full-stack (Next + FastAPI + Supabase) | Implementar features de cabo a rabo |
| `triage` | Clasificar tickets como GARANTÍA/SOPORTE/BACKLOG | Llega bug/ticket nuevo y necesita categorización |
| `business-analyst` | Levantamiento de requisitos, HUs, criterios | Nueva feature requiere especificación |
| `designer-ux-ui` | UI/UX, componentes Shadcn, flujo canvas | Pantallas nuevas, mejoras visuales |
| `security-qa` | Pentests, RLS audits, OWASP, secret scanning | Antes de release, auditorías |
| `bug-diagnostics` | Root-cause analysis con repro determinístico | Bug complejo o regresión sin causa clara |
| `testing-expert` | Vitest + Playwright + pytest + smoke suite | Crear/extender suite de tests |
| `db-integration` | Migraciones, RLS, performance, integraciones externas | Cambios de schema, scrapers nuevos |
| `ai-automation` | RAG pipeline, embeddings, derogación, voice agent | Mejorar agent, herramientas, RAG hits |
| `generador-video` | Grabar demos E2E con Playwright video | Generar videos para sales/training |

---

## INVOCACIÓN

### Desde Claude Code (este repo)

```
Agent({
  description: "...",
  subagent_type: "fullstack-dev",
  prompt: "Implementa el endpoint /v1/matters/archive..."
})
```

### Desde slash command

`/coordinator "Implementar Sprint L13: notificaciones email"`

---

## FLUJOS COMUNES

### Feature nueva

```
coordinator → business-analyst (HU) → designer-ux-ui (mockup) → arquitecto (diseño técnico)
            → db-integration (schema) → fullstack-dev (implementación) → testing-expert (tests)
            → security-qa (audit) → coordinator (release)
```

### Bug crítico en producción

```
triage (clasifica) → bug-diagnostics (root cause) → fullstack-dev (fix) → testing-expert (regresión)
                  → security-qa (si tocó auth/RLS) → coordinator (deploy)
```

### Mejora de RAG / agent

```
ai-automation (analiza hit rate) → db-integration (índices/embeddings) → testing-expert (evals)
```

---

## ESCALACIÓN

Cuando un agente no pueda completar la tarea debe:
1. Documentar el bloqueo en un Plan o memo en el repo
2. Identificar qué agente puede desbloquear
3. Devolver control al `coordinator` para reasignación

Nunca un agente debe inventar respuestas, romper convenciones o saltarse multi-tenancy.