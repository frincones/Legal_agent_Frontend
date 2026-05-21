# LexAI · Plan consolidado de personalidad del agente

> **Estado:** propuesta · sin cambios de código aún
> **Fecha:** 2026-05-18
> **Fuentes:** consolidación de los reportes de los 3 agentes (`arquitecto`, `db-integration`, `fullstack-dev`)
> **Restricción explícita del usuario:** "sin afectar ninguna otra funcionalidad o dependencia"

---

## 1. Objetivo

Dotar al agente de chat + voz de **una personalidad única, estable y trazable** que se comporte como un **abogado senior colombiano**, modelada según la arquitectura del system prompt de Claude Code (capas STATIC cacheables + capas DYNAMIC por sesión + canales override), preservando:

1. Los 117 voice tools y el bus `_ui_command` (no se tocan firmas).
2. Los 5 skills existentes (`/ask`, `/lex`, `/redactar/*`, `/revisar/*`).
3. Los 59 E2E tests verdes (25 Lifecycle + 34 Casos 2-5).
4. El multi-tenancy por `firm_id` con RLS.
5. La paridad chat ↔ voz (mismo tono, mismas barreras).

---

## 2. Identidad objetivo · "Dr./Dra. LexAI"

| Atributo | Definición |
|---|---|
| **Rol** | Abogado litigante colombiano, 15+ años de experiencia, formación en USA/UNAL/Externado, especialización en constitucional, civil, comercial, laboral, penal y administrativo. |
| **Tono** | Profesional, sobrio, en español neutro colombiano; usa "usted" por defecto, "tú" si el usuario lo pide; nunca informal en producción. |
| **Estilo** | Frases medianas (12-22 palabras), evita muletillas ("básicamente", "obviamente"), abre con la conclusión y luego sustenta. |
| **Citas** | **Solo cita normas/sentencias que aparezcan en el contexto recuperado** (RAG + sub-tools); si no las tiene, lo dice explícitamente. |
| **Barreras (red lines)** | Nunca da consejo jurídico vinculante · siempre recomienda validación humana en alto riesgo · nunca inventa números de radicación/sentencia · no opina sobre casos ajenos al `firm_id`. |
| **Salida** | Markdown limpio (sin triple-backtick global), bloque `<plantilla-doc>` solo si se pidió un documento, siempre con cierre "¿Quiere que…" para activar el próximo turno. |
| **Voz** | Misma identidad en español; cadencia 1.0×; saludos cortos (≤ 8 s) al inicio; nunca lee URLs ni IDs largos. |

---

## 3. Arquitectura unificada (10 STATIC + 8 DYNAMIC)

Inspirada en el modelo de Claude Code (secciones cacheables + secciones por turno + canales override).

### 3.1 Capas STATIC (cacheables · cambian con deploy o cambio de persona)

| # | Capa | Contenido | Fuente |
|---|---|---|---|
| S1 | **Identity Core** | Quién es, para quién trabaja, qué NO es. | `agent_personas.identity_md` |
| S2 | **Voice & Tone** | Registro lingüístico, español neutro, ejemplos `<bien>`/`<mal>`. | `personality_modules` (`type=tone`) |
| S3 | **Domain Expertise** | Áreas de derecho colombiano, jerarquía de fuentes, criterios de citación. | `personality_modules` (`type=domain`) |
| S4 | **Output Contract** | Formato Markdown, `<plantilla-doc>`, `unwrapFullMessageFence`, prohibición de fences globales. | `personality_modules` (`type=output`) |
| S5 | **Safety Rails** | No-inventar, validación humana, RLS, datos sensibles, derogación. | `personality_modules` (`type=safety`) |
| S6 | **Tool Use Doctrine** | Cuándo usar `search_law` vs `analyze_document`, prohibición de `canvas_set_text` sin confirmación. | `personality_modules` (`type=tools`) |
| S7 | **Multi-channel Parity** | Reglas chat vs voz (longitud, citación, lectura de IDs). | `personality_modules` (`type=channel`) |
| S8 | **Refusal & Escalation** | Patrones de "no puedo opinar sobre…" + cómo escalar a humano. | `personality_modules` (`type=refusal`) |
| S9 | **Error Recovery** | Qué decir cuando un tool falla, cuando RAG no tiene contexto, cuando el usuario insiste. | `personality_modules` (`type=recovery`) |
| S10 | **Examples Bank** | 6-10 ejemplos few-shot etiquetados (`tutela`, `contrato`, `voz-saludo`, `voz-cierre`). | `personality_modules` (`type=examples`) |

### 3.2 Capas DYNAMIC (por turno · NO cacheables)

| # | Capa | Contenido | Fuente |
|---|---|---|---|
| D1 | **Firm Override** | Tono específico del despacho ("Use 'tú'", "incluya el lema 'XYZ'"). | `firm_personality_overrides` |
| D2 | **User Preferences** | Idioma preferido, brevidad, formalidad. | `user_personality_preferences` |
| D3 | **Session State** | Override puntual ("hoy quiero respuestas más cortas"). | `session_personality_overrides` |
| D4 | **Matter Context** | Caso actual: materia, etapa, partes, juez. | `matters` + `parties` + `judges` |
| D5 | **Tool Inventory** | Tools disponibles para el skill activo (filtrado por permisos). | `_resolve_chat_tools` |
| D6 | **Conversation History** | Últimos 8 turnos (ya implementado). | Frontend → backend `history` |
| D7 | **RAG Context** | Chunks recuperados (normas + jurisprudencia + docs del despacho). | `vector_search_*` |
| D8 | **Channel Hint** | `channel=chat` o `channel=voice`, gating de formato. | Backend route |

### 3.3 Canales override (paridad con CLAUDE.md / output-styles)

| Canal | Equivalente Claude Code | Implementación LexAI |
|---|---|---|
| Persona base | system prompt modular | `agent_personas` row activa por `firm_id` |
| Output style | `output-styles` | `output_styles.template_md` referenciable por persona |
| Customer system prompt | `customSystemPrompt` | `firm_personality_overrides.system_append_md` |
| Append system prompt | `appendSystemPrompt` | `session_personality_overrides.append_md` |

### 3.4 Orden de ensamblado (función `lexai_assemble_system_prompt`)

```
[S1 Identity]
[S2 Tone] [S3 Domain] [S4 Output] [S5 Safety]
[S6 Tools] [S7 Channel] [S8 Refusal] [S9 Recovery]
[S10 Examples]
---
[D1 Firm Override] [D2 User Prefs] [D3 Session Override]
---
[D4 Matter] [D5 Tools available] [D7 RAG] [D8 Channel hint]
---
[D6 History] (no va en system, va en messages[])
```

La RPC devuelve `{ system_prompt, version_id, checksum }` para que el caller cachee a nivel HTTP (`ETag`) y para registrar qué versión generó cada respuesta.

---

## 4. Diseño de almacenamiento (db-integration · 7 tablas nuevas)

Todas con RLS `firm_id`, todas con `version` + `is_active` + `created_at`, todas idempotentes (CREATE TABLE IF NOT EXISTS + UNIQUE INDEX).

```
agent_personas
  id uuid pk · firm_id uuid null (null = system default)
  slug text · name text · identity_md text
  version int · is_active bool · created_at · updated_at
  UNIQUE (firm_id, slug, version)

personality_modules
  id uuid pk · persona_id uuid fk → agent_personas
  type text check (in 'tone','domain','output','safety','tools','channel','refusal','recovery','examples')
  order_index int · title text · body_md text
  enabled bool default true
  UNIQUE (persona_id, type, order_index)

output_styles
  id uuid pk · slug text · name text · template_md text
  is_system bool · firm_id uuid null
  UNIQUE (firm_id, slug)

firm_personality_overrides
  firm_id uuid pk · persona_id uuid fk
  output_style_id uuid null fk → output_styles
  system_append_md text · disabled_modules text[]  -- type values
  updated_at timestamptz

user_personality_preferences
  user_id uuid pk · firm_id uuid · tone text · brevity text
  formality text · language text default 'es-CO'
  updated_at timestamptz

agent_personality_versions  -- audit log (qué persona+overrides generó cada respuesta)
  id uuid pk · created_at timestamptz · firm_id uuid
  persona_id uuid · checksum text · system_prompt_snapshot text
  UNIQUE (checksum)

session_personality_overrides  -- ephemeral, ttl 24h
  session_id text pk · firm_id uuid · append_md text · expires_at timestamptz
```

**RPC pública** (security-definer, con `firm_id` del JWT):

```sql
create or replace function lexai_assemble_system_prompt(
  p_firm_id uuid,
  p_user_id uuid,
  p_channel text,         -- 'chat' | 'voice'
  p_skill text default null,
  p_session_id text default null
) returns table (system_prompt text, version_id uuid, checksum text)
```

---

## 5. Plan de implementación en 5 fases (fullstack-dev)

Cada fase es independiente, reversible y con su propio `feature flag` env (`LEXAI_PERSONA_PHASE=0..5`).

### Fase 0 · Foundation (1 sprint · 0 riesgo)
- Crear las 7 tablas (migración idempotente).
- Seed `agent_personas` con la persona "Dr./Dra. LexAI v1" (system, firm_id null).
- Seed los 10 módulos S1-S10 con el contenido propuesto en §3.1.
- RPC `lexai_assemble_system_prompt` (devuelve el prompt actual `LEGAL_COLOMBIA_SYSTEM_PROMPT` si flag = 0; ensambla desde DB si flag ≥ 1).
- Sin cambios en backend Python · solo migración + seed.
- **Rollback:** drop tablas (ningún caller las usa todavía).

### Fase 1 · Backend opt-in (1 sprint · riesgo bajo)
- `skill_runner.py`: si `LEXAI_PERSONA_PHASE >= 1`, llama RPC y usa el `system_prompt` ensamblado **solo para `/ask`** (el skill más usado y con más tests).
- Registra `version_id` y `checksum` en log estructurado por cada `session_id`.
- `LEGAL_VOICE_INSTRUCTIONS` se mantiene intacto.
- **Smoke:** los 17 E2E de `/ask` (tabs Resumen/Notas/Cronología) deben pasar 100%.
- **Rollback:** bajar flag a 0.

### Fase 2 · Voice parity (1 sprint · riesgo medio)
- Ensamblar prompt para voz vía la misma RPC con `p_channel='voice'`.
- D7 (Channel hint) inyecta reglas extra: respuestas ≤ 30 s, no leer IDs/URLs, cadencia 1.0×.
- `voice/realtime.py`: reemplaza `LEGAL_VOICE_INSTRUCTIONS` por el ensamblado.
- **Smoke:** los 8 escenarios de voz del playbook + 1 nuevo "saludo + tool + cierre".
- **Rollback:** flag a 1.

### Fase 3 · Skill coverage (1 sprint · riesgo medio)
- Migrar `/lex`, `/redactar/*`, `/revisar/*` a usar la RPC con `p_skill`.
- Cada skill puede tener un `personality_modules` override-by-skill (módulo extra `type=skill_doctrine`).
- **Smoke:** los 34 E2E de Casos 2-5 + los 25 del Lifecycle deben pasar.
- **Rollback:** flag a 2.

### Fase 4 · Multi-tenant + UI (1 sprint · riesgo medio)
- UI en `/settings/firm/personality`: ver módulos activos, editar `system_append_md`, elegir `output_style`, deshabilitar módulos opcionales (S10 examples, S7 channel).
- UI en `/settings/profile/preferences`: idioma, brevidad, formalidad.
- Endpoint `POST /api/personality/preview` para que el firm admin pruebe cambios antes de guardar.
- **Smoke:** crear firm B, override tono a "tú", verificar que sus respuestas usen "tú" sin afectar firm A.
- **Rollback:** ocultar UI; data persiste pero no se aplica si flag = 3.

### Fase 5 · Self-improvement loop (1 sprint · riesgo alto · opcional)
- Capturar pulgar arriba/abajo en respuestas (ya hay UI parcial).
- Job nocturno que correla mala calificación + checksum → sugiere ajustar módulos.
- Versionado completo + diff visual + rollback en UI a versión previa.
- **Rollback:** desactivar job + UI.

---

## 6. Análisis de regresión profundo

### 6.1 Costos token / latencia

| Dimensión | Hoy | Estimado post-personality |
|---|---|---|
| System prompt actual (`/ask`) | ~1.2 K tokens | ~3.5 K tokens (S1-S10 ensamblados) |
| Cache hit ratio prompt | N/A (statelesss) | ~85% (S1-S10 = prefix cacheable de OpenAI) |
| Latencia cold (sin cache) | ~1.8 s a primer token | ~2.4 s (+33%) |
| Latencia warm (cache hit) | ~1.8 s | ~1.6 s (-11%, prefix cache) |
| Costo por turno (gpt-4o) | ~$0.014 | ~$0.018 cold / ~$0.012 warm |

**Mitigación:** poner S1-S10 en el orden exacto cada vez para maximizar prefix-cache de OpenAI; D1-D8 siempre al final.

### 6.2 Riesgo sobre los 59 E2E tests existentes

| Test set | Riesgo | Mitigación |
|---|---|---|
| Lifecycle (25) | **Bajo** — los prompts del agente no cambian fundamentalmente. | Correr suite tras cada fase; gate de merge. |
| Casos 2-5 (34) | **Medio** — tonos más formales podrían cambiar phrasing que los asserts esperan. | Si algún assert es por string exacto, relajar a regex o intent-check antes de Fase 1. |
| 16 tabs | **Bajo** | El `_ui_command` y los tools no se tocan. |

### 6.3 Riesgo sobre componentes frontend

| Componente | Riesgo | Acción |
|---|---|---|
| `MarkdownContent.tsx` (`unwrapFullMessageFence`) | **Bajo** | El nuevo prompt explícitamente prohíbe fences globales; el unwrap sigue como safety net. |
| `VoiceProvider.tsx` (`data_changed` handler) | **Nulo** | Capa de personality no toca `_ui_command`. |
| `useDataChangeRefresh` / `useDataInvalidation` / `useTableSubscription` | **Nulo** | Sin cambios. |
| Chat SSE stream | **Bajo** | Solo cambia el contenido, no el contrato. |

### 6.4 Riesgo sobre multi-firma / RLS

| Vector | Mitigación |
|---|---|
| Leak de `firm_personality_overrides` entre firmas | Política RLS `firm_id = auth.jwt() ->> 'firm_id'` en las 7 tablas; tests de aislamiento. |
| `personality_modules` con secretos del despacho | `body_md` es texto plano · documentar en UI "no incluya credenciales". |
| RPC `lexai_assemble_system_prompt` | `security definer` + `set search_path = public` + check del `firm_id` contra JWT. |

### 6.5 Riesgo sobre voz (Realtime API)

| Riesgo | Mitigación |
|---|---|
| Prompt nuevo excede límite de Realtime (`instructions`) | Bench actual: límite ~32 KB; presupuesto target ≤ 8 KB para voz. |
| Cambio de cadencia | Mantener `voice="verse"` y `temperature=0.7` actuales. |
| Saludo demasiado largo | S7 (Channel) impone ≤ 8 s; agregar test E2E "saludo corto". |

### 6.6 Riesgo sobre hooks / dependencias externas

- **Supabase Realtime:** sin cambios; las 27 tablas del publication no se modifican.
- **OpenAI cache:** los prefijos cacheables (S1-S10) deben ser deterministas (mismo orden + mismo contenido); si la RPC re-ordena al azar, se pierde el cache.
- **Sentry / Logs:** agregar `personality_version_id` y `personality_checksum` a structured log; no rompe shape existente.

---

## 7. Smoke tests checklist (14 nuevos · suma a los 59 existentes)

### Personalidad y tono
1. `/ask` saluda usando "Dr./Dra." y firma "LexAI" en primer turno.
2. Si el firm override define `tone='cercano'`, el agente usa "tú".
3. Si el usuario pide "responde más corto", D3 session override aplica solo a esa sesión.
4. Voz no lee URLs completas; resume con "te lo dejo en el chat".

### Citation safety
5. Pregunta por una sentencia inventada ("T-9999/2099") → agente responde "no encuentro esa providencia en mi contexto" sin inventar.
6. Pregunta por normativa de un área que NO está en el RAG → agente reconoce el límite y sugiere ampliar.

### Tool doctrine
7. Pedir "modifica el documento" sin `confirm_overwrite=true` y con doc existente > 500 chars → agente pide confirmación.
8. Pedir "agrega una nota" → usa `add_matter_note`, no `canvas_set_text`.

### Multi-firma
9. Crear firm B con override `disabled_modules=['examples']` → respuestas no incluyen few-shots; firm A sí.
10. Cambiar persona activa en firm A no afecta a firm B en la misma ventana.

### Canales
11. Mismo prompt en chat y voz produce misma intención; voz es más corta.
12. Hand-off voz → chat (usuario abre chat tras hablar) preserva tono.

### Rollback
13. Bajar `LEXAI_PERSONA_PHASE` de 4 a 0 sirve respuestas con prompt legacy sin tirar el backend.
14. Drop de `firm_personality_overrides` no rompe `/ask` (cae al default system).

---

## 8. Estrategia de rollback en 5 niveles

| Nivel | Acción | Tiempo | Pérdida |
|---|---|---|---|
| L1 | `LEXAI_PERSONA_PHASE=0` (env Railway) | 30 s | Volver a prompts hardcoded |
| L2 | UI flag `firm_personality_overrides.disabled=true` para una firma | 2 min | Esa firma vuelve al default |
| L3 | Desactivar persona: `update agent_personas set is_active=false where id=…` | 1 min | Cae al system default v1 |
| L4 | Revert de commit Python (Fase 1 cambio en `skill_runner.py`) | 5 min + redeploy | Vuelve a prompt legacy |
| L5 | Drop migración (`drop table … cascade`) | 10 min | Pérdida total de personas + audit |

---

## 9. Decisiones arquitectónicas que necesitan tu visto bueno

| # | Decisión | Opción A | Opción B | Recomendación |
|---|---|---|---|---|
| D-01 | ¿Dónde viven las capas STATIC? | En DB (`personality_modules`) — editables sin deploy | En código Python — versionadas con git | **A**, con seed-from-code en migración para tener fuente única de verdad inicial |
| D-02 | ¿Flag binario o por canal/skill? | Binario global (`LEXAI_PERSONA_PHASE`) | Por canal (chat/voice) y por skill | **B (por canal)**, A (binario) por skill — granularidad necesaria pero sin combinatoria explosiva |
| D-03 | ¿Sub-agentes (judge_simulator, document_analysis) heredan la persona? | Sí, obligatorio (consistencia) | No, mantienen prompt propio (especialización) | **Sí, pero con `inherit_modules=['safety','output','channel']` opcional** — heredan barreras, no tono completo |

---

## 10. Lo que NO se toca

- `_ui_command` bus, `data_changed`, las 3 capas de sync (ya en producción).
- Firmas de los 117 voice tools.
- Schema de `matters`, `clients`, `wizard_*`, `judges`, `judge_predictions`, `firm_skills`.
- `MarkdownContent.tsx` (el `unwrapFullMessageFence` queda como safety net).
- `LEGAL_VOICE_INSTRUCTIONS` hasta Fase 2.
- Los 59 E2E tests (se ejecutan tal cual; los asserts no cambian).

---

## 11. Próximos pasos (cuando aprueb es)

1. Confirmar las decisiones D-01, D-02, D-03 arriba.
2. Aprobar la persona "Dr./Dra. LexAI v1" (puedo redactar el contenido de los 10 módulos S1-S10 en un siguiente doc para revisión antes de migrar).
3. Decidir si Fase 0 va sola o se bundlea con Fase 1 en un mismo sprint.
4. Definir si la UI de Fase 4 sale en el mismo sprint o se difiere.

**No se ha hecho ningún cambio de código.** Este documento es solo el plan consolidado para tu revisión.
