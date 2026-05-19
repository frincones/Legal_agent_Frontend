---
description: Invoca el sub-agente bug-diagnostics para root-cause analysis con repro determinístico
argument-hint: "<síntoma del bug a investigar>"
---

Lanza el sub-agente `bug-diagnostics` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="bug-diagnostics") y pasa el prompt anterior textualmente. El detective reproducirá el bug, localizará la causa raíz, propondrá el fix y dejará un caso de regresión listo para testing-expert.
