---
description: Invoca el sub-agente coordinator para planear, priorizar y orquestar el equipo de agentes
argument-hint: "<tarea o feature a planear>"
---

Lanza el sub-agente `coordinator` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="coordinator") y pasa el prompt anterior textualmente. El coordinator analizará la tarea, decidirá qué agentes delegar y consolidará el resultado.
