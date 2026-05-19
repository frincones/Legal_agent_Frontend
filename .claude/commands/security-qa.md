---
description: Invoca el sub-agente security-qa para audit OWASP, validación RLS multi-tenant, scan de secrets y pre-release
argument-hint: "<área o sprint a auditar>"
---

Lanza el sub-agente `security-qa` con el siguiente prompt:

$ARGUMENTS

Usa la herramienta Agent (subagent_type="security-qa") y pasa el prompt anterior textualmente. El security-qa producirá un audit report con hallazgos (críticos/altos/medios/bajos), checklist OWASP y veredicto APROBADO / CON CONDICIONES / RECHAZADO.
