---
description: Invoca el sub-agente business-analyst para levantar HUs (Historias de Usuario) con criterios de aceptación
argument-hint: "<feature o petición funcional>"
---

Lanza el sub-agente `business-analyst` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="business-analyst") y pasa el prompt anterior textualmente. El analista devolverá una HU completa: actor, valor, flujos, criterios Gherkin, reglas de negocio y métricas de éxito.
