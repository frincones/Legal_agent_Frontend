# LexAI · Runbook de incidentes

## Status page público
URL: https://status.lexai.co (provisionar BetterStack o UptimeRobot)
Configurar monitores: `/api/health` Railway, `/` Vercel, Supabase REST `https://osyrwsbruydcyhdjvjpv.supabase.co/rest/v1/`.

## On-call rotation
Sprint 7 launch: 4 ingenieros con rotación semanal. Pager: Datadog/Sentry → PagerDuty → SMS.

## P0/P1/P2 severity

| Sev | Ejemplos | SLA respuesta |
|-----|----------|---------------|
| **P0** | Data loss, security breach, RAG alucinando jurisprudencia falsa que llega a producción | 15 min · alerta inmediata on-call |
| **P1** | Voice broken, login broken, RLS leak, exports fallando | 1 h · alerta on-call |
| **P2** | Bugs UX, métricas degradadas, lentitud no crítica | 8 h · ticket |

## Playbooks

### Backend Railway down
1. `railway logs --service legal-agent-backend --deployment` → revisar últimos 100 logs.
2. Si DB connection: revisar Supabase status + circuit breaker.
3. `railway redeploy --service legal-agent-backend` para re-arrancar contenedor.
4. Si persistente: rollback al último deploy estable con `railway redeploy <previous-id>`.

### Voice WS no conecta
1. Verificar `OPENAI_API_KEY` en Railway env vars.
2. Verificar `VOICE_TICKET_HMAC_SECRET` configurado.
3. Verificar JWKS reachable: `curl https://osyrwsbruydcyhdjvjpv.supabase.co/auth/v1/.well-known/jwks.json`.
4. Revisar logs: `railway logs … | grep voice`.

### RLS cross-tenant leak detectado
**P0 · stop-the-line**
1. Revocar permisos `authenticated` de la tabla afectada inmediatamente.
2. Auditar policies: `select * from pg_policies where tablename = '<X>'`.
3. Revisar `audit_log` para detectar exfiltración.
4. Notificar a usuarios afectados (LFPDPPP Art. 17 · 5 días hábiles).
5. Rotar `SUPABASE_SERVICE_ROLE_KEY`.

### Citation registry alucinó una sentencia
**P0 · UPL exposure**
1. Identificar el `agent_run_id` del documento generado.
2. Bloquear la cita en frontend (drop badge verificada).
3. Revisar el flow de `validate_citation` — debió bloquear inserción.
4. Hot-fix: agregar la sentencia falsa a una blocklist hasta deploy completo.
5. Post-mortem público en status page.

### Costo COGS > $25/abogado/mes
1. Revisar `agent_runs.cost_usd_total` por firm.
2. Identificar usuarios outliers (>3× promedio).
3. Cache hit rate: si <50%, revisar `prompt_caching` config.
4. Routing trinario: confirmar que Haiku se usa para clasificación.
5. Desactivar `gpt-4o` para cuentas trial si es necesario.

## Deploys

### Frontend (Vercel)
```bash
cd Legal_agent_Frontend
pnpm typecheck && pnpm test
VERCEL_TOKEN=… vercel --prod --scope freddy-ricones-projects
```

### Backend (Railway)
```bash
cd Legal_agent_Backend
railway up --service legal-agent-backend --detach
```

### Migración SQL
```bash
python scripts/run_migration.py  # idempotente
```

## Backups
- Supabase: snapshots automáticos diarios (plan Free: 7 días retención).
- **Restore drill mensual**: clonar a proyecto staging y validar integridad.

## Métricas a vigilar (Datadog / Sentry)
- `voice_e2e_ms` p50 ≤ 840 ms · p95 ≤ 1500 ms
- `e2e_ms` (text) p95 ≤ 6000 ms
- `citation_existence_rate` = 100%
- `groundedness` ≥ 0.95
- Error rate < 0.5%
- Cost USD per abogado/mes < $25

## Compliance UPL · línea roja
**Nunca** publicar copy con: "robot abogado", "AI lawyer", "reemplaza a tu abogado", "asesoría legal personalizada", "garantizo el resultado".

CI tiene `pnpm lint:upl` que bloquea merges con frases prohibidas.

## Rotación de credenciales
- `OPENAI_API_KEY`: rotar trimestralmente o ante cualquier sospecha de leak.
- `SUPABASE_SERVICE_ROLE_KEY`: rotar cada 6 meses.
- `VOICE_TICKET_HMAC_SECRET`: rotar mensualmente.
- Tokens de los empleados: revocar al offboarding (mismo día).
