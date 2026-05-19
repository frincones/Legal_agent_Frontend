---
description: Invoca el sub-agente db-integration para migraciones idempotentes, RLS, índices, scrapers y scripts de ingest
argument-hint: "<schema change o integración externa>"
---

Lanza el sub-agente `db-integration` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="db-integration") y pasa el prompt anterior textualmente. El db-integration entregará migración SQL idempotente, RLS policy, índices, y script de ingest si requiere fuente externa.
