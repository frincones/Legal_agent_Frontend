---
description: Invoca el sub-agente triage para clasificar tickets/bugs como GARANTÍA, SOPORTE, BUG-CRÍTICO, FEATURE-REQUEST o BACKLOG
argument-hint: "<descripción del ticket o bug>"
---

Lanza el sub-agente `triage` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="triage") y pasa el prompt anterior textualmente. El triage devolverá un veredicto auditable con evidencia citada del código/HUs y nivel de confianza.
