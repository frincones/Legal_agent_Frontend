---
description: Invoca el sub-agente generador-video para crear videos demo E2E con Playwright recorder
argument-hint: "<flujo a grabar como demo>"
---

Lanza el sub-agente `generador-video` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="generador-video") y pasa el prompt anterior textualmente. El generador-video creará el test Playwright con video recording habilitado, dejará el .webm en test-results/demos/ y entregará metadata YAML.
