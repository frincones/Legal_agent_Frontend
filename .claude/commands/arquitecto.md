---
description: Invoca el sub-agente arquitecto para diseño técnico, ADRs, validación RLS y contratos API
argument-hint: "<pregunta o diseño a validar>"
---

Lanza el sub-agente `arquitecto` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="arquitecto") y pasa el prompt anterior textualmente. El arquitecto producirá specs implementables (tablas, endpoints, ADR) pero NO escribirá código de aplicación.
