# LexAI · Frontend (Next.js 14 + Vercel)

Frontend de **LexAI**, asistente legal voice-first para abogados colombianos.
Stack: Next.js 14 App Router (TypeScript strict) + Tailwind 3 + Supabase Auth (SSR) + TanStack Query + Zustand + Framer Motion + cmdk + Radix UI + TipTap (canvas) + OpenAI Realtime (voz).

Backend (FastAPI) vive en `Legal_agent_backend/AgentRAGFullApp/backend/` y se despliega en **Railway**. Base de datos en **Supabase Postgres + pgvector + RLS multi-tenant**.

## Estructura

```
app/
  (auth)/           login · signup · verify-mfa
  (onboarding)/     demo (caso ficticio Pérez vs. Acme)
  (app)/            shell autenticado (Sidebar + TopBar + VoiceHUD + ⌘K)
    inicio         · dashboard diario
    casos          · lista densa + detalle (tabs) + Live Canvas
    clientes       · ficha 360 con Habeas Data
    calendario     · agenda procesal
    documentos     · biblioteca + upload
    notificaciones · DOF + HITL queue
    liquidacion    · calculadora CST standalone
    settings       · despacho · audit · privacidad
components/
  atoms/      iconos SVG, Logo
  shell/      Sidebar, TopBar
  voice/      VoiceHUD (6 estados), RealtimeClient (WS)
  cases/      CasesTable, etc.
  canvas/     LiveCanvasShell (3 paneles)
  command/    ⌘K palette (cmdk)
  hitl/       gates Human-in-the-Loop
lib/
  supabase/   browser, RSC server, service-role
  api/        railway-client tipado + SSE consumer
  stores/     zustand stores (voice, hitl, …)
  seed/       demo-data colombiana
  utils.ts    cn, formatCOP, formatDate
middleware.ts auth guard + session refresh
Legal/        template original del Designer (no se compila — solo referencia visual)
```

## Setup local

```bash
pnpm install
cp .env.local.example .env.local
# Edita .env.local con tus claves Supabase + Railway

# 1) Aplica la migración SQL en Supabase (ver Legal_agent_backend/...)
#    storage/schemas/lexai_multi_tenant_migration.sql

# 2) Levanta el backend FastAPI (Railway) en local:
cd ../Legal_agent_backend/AgentRAGFullApp/backend
pip install -r requirements.txt
python main.py   # http://localhost:8000

# 3) Frontend
pnpm dev         # http://localhost:3000
```

## Variables de entorno

Ver [.env.local.example](.env.local.example). Críticas:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — público.
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, nunca exponer.
- `SUPABASE_JWT_SECRET` — para verificar tickets server-side.
- `NEXT_PUBLIC_RAILWAY_API` + `NEXT_PUBLIC_RAILWAY_WS` — backend FastAPI.

## Sprints (PRD §8)

| Sprint | Estado | Foco |
|---|---|---|
| 0 · Setup + smoke test | ✅ scaffold listo | Decisión Build/Iterate/Kill |
| 1 · Cimientos | ✅ funcional | Auth, RLS, audit, HUD, shell, screens stub |
| 2 · Voice pipeline + Canvas v0 | 🔜 | Realtime relay E2E + TipTap streaming |
| 3 · RAG + Citation Registry + HITL | 🔜 | Sentencias verificadas + 3 gates |
| 4 · Wedge laboral + drafting + export | 🔜 | F7 form, F8 batch, F9 .docx |
| 5 · Shell + ⌘K + onboarding | 🔜 | F10 cmdk full, F11 polish, F13 demo |
| 6 · Hardening | 🔜 | Pen test, perf, COGS validation |
| 7 · Beta privada | 🔜 | 5 design partners |

## Compliance UPL · línea roja

NUNCA usar en copy del producto:
- "Soy abogado" / "AI lawyer" / "robot abogado"
- "Reemplaza a tu abogado"
- "Asesoría legal personalizada"
- "Garantizo el resultado"

SIEMPRE incluir disclaimer en exports + en cada respuesta sustantiva.

## Deploy

- **Vercel** para el frontend (`vercel deploy`).
- **Railway** para el backend (FastAPI, contenedor con Dockerfile).
- **Supabase** para la base de datos (`osyrwsbruydcyhdjvjpv` ya existe).

## Tests pendientes Sprint 1

- [ ] RLS smoke test E2E (2 firms · 0 cross-tenant leaks).
- [ ] Auth flow signup → verify-cedula → MFA → /inicio.
- [ ] Voice ticket issuance + WS handshake con OpenAI Realtime.
- [ ] Citation registry · 0 unverified citations renderable como verified.
