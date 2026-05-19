---
description: Invoca el sub-agente ai-automation para RAG, embeddings, voice agent, herramientas LLM y verifier de citas
argument-hint: "<mejora de RAG, tool nueva, eval del agente>"
---

Lanza el sub-agente `ai-automation` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="ai-automation") y pasa el prompt anterior textualmente. El ai-automation calibrará el verifier de citas, registrará tools en el voice agent, mejorará hit rate del RAG o producirá reportes de eval.
