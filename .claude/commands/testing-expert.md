---
description: Invoca el sub-agente testing-expert para crear/extender tests (Vitest, Playwright, pytest, smoke, eval)
argument-hint: "<feature a testear o suite a extender>"
---

Lanza el sub-agente `testing-expert` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="testing-expert") y pasa el prompt anterior textualmente. El testing-expert escribirá tests golden + edge cases, evitará flakiness y agregará casos de regresión cuando aplique.
