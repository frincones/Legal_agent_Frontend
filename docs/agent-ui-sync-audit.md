# Auditoría · Sincronización Agente ↔ UI · LexAI

> **Pregunta original**: ¿por qué el agente de chat/voz dice "ya hice X" pero
> cuando el abogado revisa el módulo correspondiente no ve el cambio?
>
> **Respuesta corta**: el backend ejecuta los tools correctamente y escribe en
> Postgres; el problema es que el **frontend no tiene un canal generalizado
> para enterarse de cambios en tablas**. Solo 4 tablas tienen Realtime, ningún
> módulo invalida queries (TanStack Query está instalado pero ocioso), las
> pantallas de detalle del caso son Server Components con `revalidate=30`, y
> el sidebar del asistente nunca dispara `router.refresh()` después de un
> `tool_finished`.

Fecha: 2026-05-17 · Auditoría conducida por 3 sub-agentes (backend / frontend / cross-reference) en paralelo. Base: branch `main` (backend `df12253`, frontend `def1518`).

---

## 1 · Diagnóstico raíz · las 3 capas del bug

### Capa A · El backend hace su parte (correcto)

Los 117 tools ejecutan SQL correctamente y devuelven resultado. Verificado con `/v1/admin/tools/test-batch` y curl directo al SSE: las inserciones/updates llegan a Postgres, los `_ui_command` se emiten cuando aplica. **Esta capa NO es el problema**.

### Capa B · El frontend está construido alrededor de dos patrones que NO escuchan al agente

**Patrón 1 — Server Components con `revalidate=30`**:
- Casos (lista + detalle), Inicio, Clientes (lista + detalle), Calendario, Documentos, Notificaciones, Liquidación, Cliente portal: todas son `async function Page()` con `await supabase.from(...)` + `export const revalidate = 30`.
- Implicación: cuando el agente inserta una `matter_deadline` o un `matter_note`, el HTML que ya está en pantalla viene del caché del servidor (hasta 30s + ISR + `unstable_cache` en algunos casos como `getCachedShellData`). Cambiar de pestaña dentro del caso **NO** re-ejecuta el RSC.

**Patrón 2 — Client components con `useEffect + fetch(no-store)`**:
- Tareas, Facturación, Trust, Firmas, Insights, Leads, Settings, todo el panel SaaS: usan `useState + useEffect + refresh()` interno.
- El `refresh()` solo se llama: (a) al montar, (b) tras una acción del propio usuario (click "Crear", "Marcar pagado"). Nada externo lo dispara.

**TanStack Query está instalado pero NO se usa**:
- `app/providers.tsx` monta `<QueryClientProvider>` con `staleTime: 30s` y `refetchOnWindowFocus: false`.
- Grep exhaustivo: `useQuery` = **0 ocurrencias**, `useMutation` = **0**, `invalidateQueries` = **0**. Hay ~zero queryKeys registradas — no hay handle por el cual notificar "los datos de matter X cambiaron".

**Supabase Realtime solo cubre 4 tablas** (de ~40 que tocan tools):
- `hitl_interrupts` → `HITLController` (modal global)
- `canvas_redlines` → `TrackedChangesPane` (dentro del canvas)
- `signature_envelopes` → `FirmasTab` (dentro del caso)
- `firm_integrations` → `IntegrationsGrid` (settings)

### Capa C · El canal `_ui_command` existe pero solo cubre operaciones visuales explícitas

El `uiCommandBus` (`lib/voice/ui-command-bus.ts`) y su gemelo SSE (que activamos en `84cd8fe`) están diseñados para **comandos visuales descompuestos por la tool**: `canvas_set_text`, `navigate`, `prefill_form`, `toast`. NO existe ningún `action` tipo `data_changed` / `table_updated` / `refresh_module` / `invalidate_query`.

**Resultado: la única cadena tool → UI completa es Canvas**, precisamente porque no depende de DB — opera sobre el estado in-memory del editor TipTap.

---

## 2 · Mapeo: 117 tools → estado de propagación

> **Estado**: ✅ se refleja en UI · ⚠️ se refleja parcial o solo con refresh manual · ❌ NO se refleja sin F5 / `router.refresh()` · 🚫 funcionalidad inexistente.
>
> Tablas DB escritas: ver hallazgos completos del agente backend.

### 2.1 Tools UI-bridge (✅ cadena completa)

Estas son las únicas que funcionan end-to-end automáticamente.

| Tool | Action emitida | Handler | Estado |
|---|---|---|---|
| `canvas_set_text` | `canvas_set_text` | CanvasEditor.set_text | ✅ |
| `canvas_append` | `canvas_append` | CanvasEditor.append | ✅ |
| `canvas_replace_section` | `canvas_replace_section` | CanvasEditor.replace_section | ✅ |
| `canvas_insert_at_cursor` | `canvas_insert_at_cursor` | CanvasEditor.insert_at_cursor | ✅ |
| `canvas_find_replace` | `canvas_find_replace` | CanvasEditor.find_replace | ✅ |
| `canvas_select_section` | `canvas_select_section` | CanvasEditor.select_section | ✅ |
| `canvas_save_version` | `canvas_save_version` | CanvasEditor.save_version | ✅ |
| `canvas_get_current` | (read-only, devuelve DB) | — | ✅ |
| `ui_navigate` | `navigate` | VoiceProvider.router.push | ✅ |
| `ui_open_matter_canvas` | `navigate` | router | ✅ |
| `ui_open_matter_tab` | `open_matter_tab` | MatterTabs evento | ✅ |
| `ui_scroll_to` | `scroll_to` | scrollIntoView | ✅ |
| `ui_open_command_palette` | `open_command_palette` | CommandPalette open | ✅ |
| `ui_prefill_form` | `prefill_form` | FormApi.setValues + submit | ✅ |
| `ui_show_toast` | `toast` | sonner | ✅ |
| `ui_open_modal` | `open_modal` | window.confirm (MVP) | ⚠️ (MVP) |

Subtotal: **16/117 tools ✅**

### 2.2 Tools de escritura · ❌ no se reflejan en UI

Estas son la mayoría del catálogo y la fuente real del problema reportado. Todas escriben a DB pero NO emiten `data_changed` ni hay listener Realtime para sus tablas.

| Tool | Tabla DB escrita | Módulo UI que debería reflejar | Estado |
|---|---|---|---|
| **CASOS / MATTER** | | | |
| `add_matter_note` | `matter_notes` | `/casos/[id]` pestaña Notas (RSC) | ❌ |
| `add_matter_deadline` | `matter_deadlines` + `matter_timeline` | `/casos/[id]` (sidebar Próximos plazos + tab Calendario), `/calendario`, MyDay | ❌ |
| `mark_deadline_done` | `matter_deadlines` UPDATE | mismos que arriba | ❌ |
| `extract_document_entities` | `document_extractions` + `matter_parties` | `/casos/[id]` Análisis IA + Partes | ❌ |
| `draft_pleading` | `matter_documents` + `matter_document_versions` | `/casos/[id]` Documentos, Documentos global | ❌ |
| `analyze_contract` | `contract_analyses` (async INSERT → UPDATE) | `/casos/[id]` Análisis | ❌ |
| `ask_about_document` | `doc_qa_sessions` + `doc_qa_messages` | (sin UI dedicada para historial) | ⚠️ |
| `compare_documents` | `doc_comparisons` | (sin UI dedicada) | ⚠️ |
| **TAREAS / PRODUCTIVIDAD** | | | |
| `create_task` | `tasks` | `/tareas` TasksList, MyDay | ❌ |
| `complete_task` | `tasks` UPDATE | mismos | ❌ |
| `what_today` | (read-only RPC) | — | ✅ |
| `what_is_my_priority` | (read-only) | — | ✅ |
| **JUDICIAL / CALENDARIO** | | | |
| `subscribe_to_expediente` | `judicial_subscriptions` | (Sin lista visible de suscripciones) | ⚠️ |
| `poll_judicial_now` | `judicial_notifications` INSERT vía worker | `/notificaciones` JudicialInbox | ❌ |
| `sync_calendar` | `calendar_events` + `calendar_integrations` | `/calendario`, `/settings/integraciones` | ❌ |
| **FACTURACIÓN / TIME / EXPENSES** | | | |
| `track_time` | `time_entries` | `/casos/[id]` Horas y Gastos | ❌ |
| `log_expense` | `expenses` | mismos | ❌ |
| `generate_invoice` | `invoices` + `invoice_lines` + UPDATE `time_entries.invoice_id` | `/facturacion` InvoicesList, dashboards Revenue | ❌ |
| **TRUST (cuenta fiduciaria)** | | | |
| `check_trust_balance` | (read-only RPC) | — | ✅ |
| `record_trust_deposit` | `trust_transactions` | `/trust` TrustDashboard | ❌ |
| `record_trust_payment` | `trust_transactions` | mismos | ❌ |
| **COLABORACIÓN / COMENTARIOS** | | | |
| `add_comment` | `comments` + push notification | `/casos/[id]` CommentsThread, `/menciones`, `/actividad` | ❌ (✅ push sí llega) |
| `resolve_comment` | `comments` UPDATE | mismos | ❌ |
| `show_activity` | (read-only RPC) | — | ✅ |
| `show_active_users` | (read-only RPC) | — | ✅ |
| **FIRMAS DIGITALES** | | | |
| `send_for_signature` | `signature_envelopes` + `signature_signers` + DocuSign API | `/firmas` global (❌), `/casos/[id]/firmas` FirmasTab (✅ Realtime) | ⚠️ |
| `check_signature_status` | (read + may UPDATE) | mismos | ⚠️ |
| **CRM / LEADS / INTAKE** | | | |
| `capture_lead` | `leads` | `/leads` LeadsBoard | ❌ |
| `list_intake_forms` | (read-only) | — | ✅ |
| `list_new_submissions` | (read-only) | — | ✅ |
| `import_csv` | INSERT masivo `clients` o `matters` o `time_entries` | `/clientes`, `/casos`, varios | ❌ |
| **AI INSIGHTS / AUTOMATION** | | | |
| `generate_insights` | `ai_insights` múltiples filas | `/insights` InsightsList | ❌ |
| `run_automation` | **cualquier tabla** (caja negra) + `automation_runs` | depende de la regla | ❌ |
| **KB / LECCIONES / MEMORIA** | | | |
| `add_to_kb` | `knowledge_entries` | `/kb` KBBrowser | ❌ |
| `extract_lesson` | `case_lessons` UPSERT | `/casos/[id]` MatterLessonsTab | ❌ |
| `search_kb`, `search_lessons` | (read-only) | — | ✅ |
| `remember` / `forget` | `agent_memory` | (sin UI dedicada — el agente lo usa internamente) | n/a |
| `recall` / `recall_relevant` | (read-only) | — | ✅ |
| **REVIEW CONTRATOS / REDLINES** | | | |
| `review_contract` | `skill_executions` + posible `contract_analyses` / `canvas_redlines` | `/casos/[id]` (varios) | ❌ (canvas_redlines sí Realtime parcial) |
| `apply_redline` | `canvas_redlines` UPDATE | TrackedChangesPane | ✅ (Realtime) |
| `reject_redline` | `canvas_redlines` UPDATE | TrackedChangesPane | ✅ (Realtime) |
| **EVIDENCIA / VALIDACIÓN** | | | |
| `validate_identity` | `verification_attempts` + HTTP a RUES | `/casos/[id]` EvidenceCheckPanel | ❌ |
| `check_doc_consistency` | `inconsistency_reports` | mismos | ❌ |
| `score_evidence` | `probative_scores` (+ cascada) | mismos | ❌ |
| **PREDICCIONES** | | | |
| `predict_outcome` | `case_predictions` INSERT (audit trail) | `/casos/[id]` MatterPredictionCard, `/dashboard` PredictionAccuracy | ❌ |
| **WIZARDS / SKILLS** | | | |
| `list_wizards` / `wizard_session_status` | (read-only) | — | ✅ |
| `start_wizard` | `wizard_sessions` INSERT | (URL pública nueva) | ⚠️ |
| `execute_skill` | `skill_executions` + side effects de la skill | múltiple | ❌ |
| **EMAILS / SLA / BRIEFING** | | | |
| `parse_legal_email` | `email_messages` UPDATE | `/notificaciones` UnifiedInboxFeed | ❌ |
| `sync_email_now` | `email_messages` INSERT múltiples | mismos | ❌ |
| `run_sla_reminders` | `sla_reminders` / `notifications` + dispatch | `/notificaciones` | ❌ |
| `daily_briefing` | (read-only sintetizado) | — | ✅ |
| **WHATSAPP** | | | |
| `send_whatsapp` | `whatsapp_messages` + Graph API | (sin inbox WhatsApp) | ⚠️ |
| **HITL** | | | |
| `request_human_approval` | `hitl_interrupts` | `HITLController` modal | ✅ (Realtime) |
| `list_pending_hitl` | (read-only) | — | ✅ |
| **CALCULADORES (persisten cuando hay matter_id)** | | | |
| `calc_liquidacion` / `calc_prescripcion` / `calc_intereses` | `calc_results` INSERT | `/liquidacion`, `/calc/*` historiales | ❌ |
| **RESEARCH / ANALYTICS / BÚSQUEDA / QUOTAS / ADMIN** | | | |
| `research_jurisprudence`, `validate_citation`, `validate_norm_vigencia`, `search_*`, `fetch_*`, `find_*`, `firm_*`, `lawyer_performance`, `executive_kpis`, `query_audit_logs`, `current_plan_status`, `remaining_quota`, `pricing_recommendation`, `saas_*` (5 tools), `get_judge_stats`, `simulate_judge_view`, etc. | (read-only, posible cache update en `external_fetch_cache`) | — | ✅ |
| **META** | | | |
| `delegate_to` | (depende del sub-agente · `_ui_command` se PIERDE en el camino) | varía | ❌ crítico |

**Resumen cuantitativo aproximado**:
- ✅ End-to-end OK: ~35 tools (UI-bridge + read-only)
- ⚠️ Parcial / sin UI dedicada: ~10 tools
- ❌ Escribe a DB pero **no se refleja**: ~70 tools
- 🚫 Funcionalidad inexistente cuando se pide: `tag_matter`, `set_matter_priority`, `update_matter_etapa` desde chat — no están registradas (el agente puede alucinar éxito)

### 2.3 Detalle de los gaps más sangrantes

#### `delegate_to` rompe el bridge `_ui_command`
Cuando el orquestador delega a un sub-agente (investigador/redactor/calculista) y este llama `canvas_*`, el `_ui_command` queda **atrapado dentro del sub-agente** y se devuelve serializado al LLM padre como texto. El frontend nunca lo recibe. El sub-agente "ejecutó canvas_set_text", el LLM lo cuenta al usuario, pero el editor no se actualiza.

#### Skills llamadas por chat path no-stream
- `execute_skill` y `review_contract` cuando se invocan vía `run_skill` (path no-stream) **descartan** los `_ui_command` (línea 545-547 del skill_runner.py). Solo el path stream (`run_skill_stream`) los reenvía. Si el chat usa path no-stream, las skills no actualizan el canvas.

#### Canvas tools NO escriben a DB directamente
- Las 7 canvas tools dependen 100% del autosave del editor (cada 3s). Si el `_ui_command` se aplica pero el editor pierde foco / hace unmount / hay error de red, el autosave puede no dispararse. El agente reporta "guardé" pero no hay persistencia ni reflejo permanente.

#### `run_automation` es la caja negra más grande
Puede insertar/actualizar en CUALQUIER tabla (depende de la rule). El LLM dice "automaticé X" sin detalle de qué se persistió. UX no tiene forma de saber qué cambió.

---

## 3 · Gaps priorizados por impacto al abogado

### P0 · Bloquea uso diario (resolver YA)

| # | Cadena rota | Frecuencia | Por qué es P0 |
|---|---|---|---|
| 1 | `add_matter_deadline` / `mark_deadline_done` → `/casos/[id]` Calendario + Resumen + `/calendario` global + MyDay | **Diaria** | Los plazos son la columna vertebral del despacho · "agendé audiencia" sin ver el plazo destruye la confianza |
| 2 | `add_matter_note` → `/casos/[id]` Notas | Diaria | Use case principal de dictado por voz |
| 3 | `create_task` / `complete_task` → `/tareas` + MyDay | Diaria | Centro de productividad |
| 4 | `track_time` / `log_expense` → `/casos/[id]` Horas y Gastos | Diaria | Base de cobranza — si no se ve, riesgo de doble registro |
| 5 | `generate_invoice` → `/facturacion` InvoicesList | Semanal pero alto valor | Riesgo de dispararla 2 veces si no aparece |
| 6 | `delegate_to` → cuando el sub-agente llama canvas | Frecuente al pedir tareas complejas | El usuario ve "delego al redactor" pero no recibe el output |
| 7 | Tools de escritura sobre matter (`draft_pleading`, `extract_document_entities`, `analyze_contract`) → Documentos / Análisis / Partes | Frecuente | Resultados de análisis son la propuesta de valor IA |

### P1 · Funcionalidad importante pero recoverable con refresh manual

| # | Cadena rota | Notas |
|---|---|---|
| 8 | `record_trust_deposit/payment` → `/trust` | Contabilidad cliente · sensible |
| 9 | `send_for_signature` → `/firmas` global (la `FirmasTab` por caso sí funciona) | DocuSign Realtime cubre pestaña pero no lista global |
| 10 | `capture_lead` → `/leads` LeadsBoard | Pipeline comercial |
| 11 | `add_comment` / `resolve_comment` → `/casos/[id]` CommentsThread + `/menciones` | Push sí llega; UI no refresca |
| 12 | `extract_lesson` → `/casos/[id]` MatterLessonsTab | Knowledge management |
| 13 | `predict_outcome` → `/casos/[id]` MatterPredictionCard | Calidad de feature IA |
| 14 | `add_to_kb` → `/kb` KBBrowser | Knowledge management |
| 15 | Resto de tools de evidencia / scoring / inconsistency | EvidenceCheckPanel |

### P2 · Admin / ocasional · puede esperar

- `sync_email_now`, `sync_calendar`, `poll_judicial_now`, `run_sla_reminders` → bandejas y calendarios
- Todo el panel SaaS admin
- Settings de cuotas, billing, plantillas, etc.
- `generate_insights` → InsightsList
- `import_csv` jobs (ya tiene polling interno para el job activo)

### 🚫 Funcionalidades faltantes (no es solo refresh — la tool no existe)

- `tag_matter` — solo existe como acción de automation worker, NO como voice/chat tool
- `set_matter_priority` — no registrada
- `update_matter_etapa` — no registrada
- `create_matter` desde chat — verificar (el agente puede inventar éxito)
- `archive_matter` — no registrada

---

## 4 · Plan de remediación · 3 capas progresivas

> Todas las opciones son **aditivas**. Ninguna rompe lo que ya funciona.

### Capa 1 · Quick win · 1-2 días · cubre ~90% del problema

**Idea**: añadir un nuevo `_ui_command` tipo `data_changed` que cada tool de escritura emita, y un handler global que invoque `router.refresh()` + dispatch de CustomEvent para componentes client-side.

**Backend**:
- Helper en `agent/tools/_helpers.py` (nuevo o existente):
  ```
  def emit_data_changed(resource: str, *, matter_id: str | None = None,
                         firm_id: str, op: str = "create") -> dict:
      return {"action": "data_changed", "resource": resource,
              "matter_id": matter_id, "firm_id": firm_id, "op": op}
  ```
- Cada tool de escritura agrega 1 línea al final de su return:
  ```
  return {..., "_ui_command": emit_data_changed("deadlines", matter_id=mid, firm_id=fid, op="create")}
  ```
- Tabla de mapping `tool → resource`:
  - `add_matter_deadline` / `mark_deadline_done` → `"deadlines"`
  - `add_matter_note` → `"notes"` (con `matter_id`)
  - `create_task` / `complete_task` → `"tasks"`
  - `track_time` → `"time_entries"`
  - `log_expense` → `"expenses"`
  - `generate_invoice` → `"invoices"`
  - `record_trust_*` → `"trust_transactions"`
  - `capture_lead` → `"leads"`
  - `add_comment` / `resolve_comment` → `"comments"`
  - `draft_pleading` / `extract_document_entities` / `analyze_contract` → `"documents"` con `matter_id`
  - `predict_outcome` / `extract_lesson` → `"predictions"`, `"lessons"`
  - `validate_identity` / `check_doc_consistency` / `score_evidence` → `"evidence"`
  - `add_to_kb` → `"kb"`
  - `start_wizard` → `"wizards"`
  - `sync_*` → `resource` específico (`"emails"`, `"calendar_events"`, `"judicial"`)

**Frontend**:
- Extender el type union en `lib/voice/ui-command-bus.ts`:
  ```
  | { action: 'data_changed'; resource: string; matter_id?: string;
      firm_id?: string; op?: 'create' | 'update' | 'delete' }
  ```
- Handler global en `VoiceProvider.tsx` (alrededor de línea 51):
  ```
  uiCommandBus.register('data_changed', (cmd) => {
    if (cmd.action !== 'data_changed') return false;
    router.refresh();
    window.dispatchEvent(new CustomEvent('lexai:data-changed', {
      detail: { resource: cmd.resource, matter_id: cmd.matter_id, op: cmd.op },
    }));
    return true;
  });
  ```
- Componentes client-side críticos (`InvoicesList`, `TasksList`, `MyDayDashboard`, `TrustDashboard`, `LeadsBoard`, `EnvelopesList`, `InsightsList`, `KBBrowser`, `MatterLessonsTab`, `HorasGastosTab`, `CommentsThread`, `JudicialInbox`, `LegalAlertsInbox`, `UnifiedInboxFeed`) agregan un listener:
  ```
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d.resource === 'invoices') void refresh();
    };
    window.addEventListener('lexai:data-changed', h);
    return () => window.removeEventListener('lexai:data-changed', h);
  }, [refresh]);
  ```

**Bonus crítico** que esta capa resuelve gratis:
- `router.refresh()` re-ejecuta los Server Components → todas las pestañas RSC del caso (Resumen, Notas, Deadlines, Documentos, Partes, Cronología, Calendario) se actualizan sin más cambios.
- Funciona para voice path (vía WS `ui.command`) y chat path (vía SSE `ui_command`) sin tocar la cañería.

**Resolver `delegate_to`** en la misma capa:
- En `agent/subagents/registry.py`, propagar `_ui_command`s del sub-agente hacia el resultado del padre como lista (`_ui_commands: [...]`), y en `voice.py` / `skill_runner.py` despachar cada una al frontend.

**Resolver path no-stream de skills**:
- `skill_runner.py:545-547` actualmente descarta `_ui_command`. Cambiar para que también los acumule en el resultado.

**Esfuerzo estimado**: 1-2 días de implementación + smoke tests.

### Capa 2 · Mejora UX · 1-2 semanas

Migrar los listados más críticos a TanStack Query con `queryKey` documentado:
- `['matters', matterId, 'deadlines']`, `['matters', matterId, 'notes']`, `['tasks', filters]`, `['invoices', filters]`, etc.

En lugar de `router.refresh()` (que re-renderiza todo el segmento RSC), el handler global hace:
```
queryClient.invalidateQueries({ queryKey: [cmd.resource, cmd.matter_id].filter(Boolean) });
```

Beneficios: refetch quirúrgico (solo la query exacta), cache compartida entre componentes, suspense/loading states consistentes.

Costo: migración de ~30-40 componentes de `useEffect-fetch` a `useQuery`. Plan por fases (P0 primero, luego P1, P2).

### Capa 3 · Long-term defensive · cuando haya colaboración multi-usuario activa

Activar Supabase Realtime para las ~10 tablas críticas adicionales. Patrón ya probado en `TrackedChangesPane` / `FirmasTab` / `HITLController` / `IntegrationsGrid`.

Hook compartido `useTableSubscription(table, filter)` que cada panel use. Esto cubre el caso edge de **OTRO usuario del despacho** modificando data — `_ui_command` solo notifica al cliente que disparó el tool.

Requiere: asegurar RLS bien afinada (ya está), aceptar costo de connections, capacity planning de Realtime channels.

### Funcionalidades faltantes a registrar

Aparte del plan de propagación, agregar estos tools (cada uno es ~1 día):
- `set_matter_priority(matter_id, priority)` → UPDATE matters
- `tag_matter(matter_id, tag)` → UPDATE matters.metadata.tags (extraer del worker `_action_tag_matter`)
- `update_matter_etapa(matter_id, etapa)` → UPDATE matters
- `archive_matter(matter_id, reason)` → UPDATE matters (soft delete)
- `create_matter(titulo, materia, cliente)` → INSERT matter (si no existe)

Cada uno debe emitir `data_changed` con `resource="matters"` para que listas + dashboards se actualicen.

---

## 5 · Resumen ejecutivo para acción

1. **Capa 1 resuelve el 90% del problema con el menor riesgo y código posible.** Es ~1 línea por tool de escritura en backend + 1 handler global en frontend + listeners selectivos en ~10-15 componentes client-side.
2. **Las cadenas que ya funcionan no se tocan** (canvas_*, ui_*, las 4 tablas con Realtime, las read-only).
3. **Los gaps P0 cubren el 80% del valor diario**: deadlines, notas, tareas, time/expenses, invoices, delegate_to.
4. **Después de Capa 1**, la sensación del usuario será que "el agente realmente edita la app". Capa 2 y 3 son optimizaciones progresivas.
5. **Funcionalidades faltantes** (tag_matter, set_priority, etc.) son ortogonales — pueden agregarse en sprints separados con el mismo patrón.

### Próximos pasos sugeridos

1. **Aprobar Capa 1** como sprint corto enfocado.
2. **Implementar en orden**:
   - Backend: helper + 7 tools P0 → push.
   - Frontend: handler global + listeners P0 → push.
   - Verificación E2E: ejecutar cada uno de los 7 escenarios P0 y confirmar refresco visible.
3. **Iterar**: agregar tools P1 → P2 en commits incrementales.
4. **Documentar el contrato**: en el `arquitecto.md` y `fullstack-dev.md`, añadir la regla "toda tool de escritura debe emitir `data_changed`".
5. **Lint check** (opcional): test que escanea `agent/tools/` y reporta tools de escritura sin `_ui_command` para evitar regresiones.

---

## Anexo · Referencias clave

### Backend
- `agent/tools/paralegal_tools.py:205,248,277` — `add_matter_deadline`, `mark_deadline_done`, `add_matter_note`
- `agent/tools/canvas_edit.py` — patrón completo de `_ui_command` (referencia)
- `agent/subagents/registry.py:47` — `delegate_to` (donde se pierden ui_commands del sub-agente)
- `api/voice.py:1643-1655` — relay `_ui_command` por WS
- `utils/skill_runner.py:104-106` (path no-stream descarta), `:324-325` (path stream sí reenvía como `ui_command` SSE)
- `agent/workers/automation_runner.py:205,278` — `_action_tag_matter` (existe como worker, no como tool)
- `main.py:130-228` — registro de todas las tools

### Frontend
- `app/providers.tsx` — QueryClient ocioso
- `lib/voice/ui-command-bus.ts` — bus + type union
- `components/voice/VoiceProvider.tsx:51-203` — donde agregar el handler `data_changed`
- `components/assistant/AssistantSidebar.tsx:202-217` — dispatch del SSE del chat
- `app/(app)/casos/[matterId]/page.tsx:31-55` — RSC con `revalidate=30` que se beneficia de `router.refresh()`
- `components/hitl/HITLController.tsx`, `components/canvas/TrackedChangesPane.tsx`, `components/docusign/FirmasTab.tsx`, `components/settings/IntegrationsGrid.tsx` — los 4 patrones Realtime existentes (referencia)
- `components/billing/InvoicesList.tsx`, `components/tasks/TasksList.tsx` — ejemplos de client-side `refresh()` que necesitan exponerse via listener

### Reportes fuentes
Esta auditoría consolida 3 reportes paralelos:
- Backend tool catalog (general-purpose agent → backend)
- Frontend modules mapping (general-purpose agent → arquitecto rol)
- Cross-reference + traces (general-purpose agent → fullstack-dev rol)
