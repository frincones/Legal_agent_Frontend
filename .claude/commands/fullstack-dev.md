---
description: Invoca el sub-agente fullstack-dev para implementar features Next.js + FastAPI + Supabase end-to-end
argument-hint: "<feature a implementar>"
---

Lanza el sub-agente `fullstack-dev` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="fullstack-dev") y pasa el prompt anterior textualmente. El fullstack-dev escribirá código real respetando convenciones del repo (multi-tenancy, idempotencia, sin secrets hardcoded).
