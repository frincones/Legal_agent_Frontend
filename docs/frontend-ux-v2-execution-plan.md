# LexAI · Plan de ejecución UX/UI v2 — Todo list detallado

> **Estado:** APROBADO por el usuario (5 decisiones aprobadas)
> **Fecha:** 2026-05-20
> **Decisiones aprobadas:** New Spirit (serif Google Fonts) · accent cobre #B8763C · model selector visible · dark mode en Fase 6 · sidebar 5 items (Inicio · Casos · Documentos · Calendario · Skills)
> **Duración estimada:** ~7 semanas con feature flags y ciclo de test al final de cada fase
> **Restricción crítica:** "sin afectar ninguna otra funcionalidad o dependencia" — todo nuevo vive en /components/v2/ y /app/v2/, los componentes actuales no se tocan hasta el switch final

---

## Arquitectura del rollout

```
main branch siempre verde · feature flags por fase
─────────────────────────────────────────────────
NEXT_PUBLIC_UX_V2_TOKENS   (Fase 0 · tokens visuales)
NEXT_PUBLIC_UX_V2_SHELL    (Fase 1 · sidebar + Cmd+K)
NEXT_PUBLIC_UX_V2_HOME     (Fase 2 · Day Briefing thread)
NEXT_PUBLIC_UX_V2_COMPOSER (Fase 3 · composer estilo Claude)
NEXT_PUBLIC_UX_V2_MATTER   (Fase 4 · MatterArtifact)
NEXT_PUBLIC_UX_V2_CANVAS   (Fase 5 · canvas integrado al thread)
NEXT_PUBLIC_UX_V2_DARK     (Fase 6 · dark mode + a11y AAA)

Default: todos en false → producción actual sin cambios
```

Cada fase tiene 3 checkpoints:
1. **Build green:** TypeScript compila + Vitest pasa + Playwright pasa
2. **Visual review:** screenshot diff vs baseline (usar `playwright test --update-snapshots` para baseline inicial)
3. **Regression suite:** los 59 E2E + 14 smoke de personalidad siguen pasando

---

## FASE 0 — Design tokens v2 (3 días · 0 riesgo)

**Objetivo:** sistema visual completo cargado, accesible vía flag, sin tocar layouts.

### Tasks

- **F0-T01** Instalar `next/font` con New Spirit (serif) y verificar que Inter ya está. Si no, agregarla. Output: `app/fonts.ts` con `newSpirit` y `inter` exports.
- **F0-T02** Crear `styles/tokens-v2.css` con CSS variables: tipografía (5 sizes display/title/h2/body/caption), paleta completa (brand navy, accent cobre, neutrales stone, semánticos), espaciado scale 4px, radios 12-16, shadows 3 niveles, animaciones (timing functions + durations).
- **F0-T03** Crear `tailwind.config.ts` extension `theme.extend.v2.*` con las clases nuevas sin pisar las actuales (prefijo `v2-` opcional o usar arbitrary values).
- **F0-T04** Crear hook `useV2Tokens()` en `hooks/useV2Tokens.ts` que lee `NEXT_PUBLIC_UX_V2_TOKENS` y aplica clase `data-v2-tokens` al `<html>`.
- **F0-T05** Crear página de showcase `app/(internal)/v2-showcase/page.tsx` que renderiza todos los tokens (typography scale, color swatches, spacing, shadows, motion examples) — accesible solo localmente con el flag.
- **F0-T06** Confirmar que `framer-motion` está en package.json (v11.13.1 según la verificación del designer). Si no, instalar.
- **F0-T07** Documentar tokens en `components/v2/README.md` con tabla de uso.

### Testing F0

- **F0-TEST-01** Vitest test que el hook `useV2Tokens` aplica/quita la clase `data-v2-tokens` según el flag.
- **F0-TEST-02** Playwright visual snapshot de `/v2-showcase` con flag ON.
- **F0-TEST-03** Build production sin errores (`pnpm build`).
- **F0-TEST-04** Lighthouse run sobre `/v2-showcase` → score Performance ≥ 90, Accessibility ≥ 95.
- **F0-TEST-05** Correr smoke FE actual (Playwright) con flag OFF → 0 regresión.

### Checkpoint F0

✅ Si: tokens renderizan en showcase, sin layout shift en producción con flag OFF, build verde.
❌ Si: alguna fuente no carga, contraste falla AA, build rompe.

---

## FASE 1 — Sidebar v2 + Command Palette (1 semana · riesgo bajo)

**Objetivo:** sidebar de 24 items reducido a 5 top-level + sección hilos + sección skills, con Cmd+K funcional.

### Tasks Sidebar

- **F1-T01** Crear `components/v2/shell/SidebarV2.tsx` con estructura: header (logo + firm) · sección top 5 items · "Mis hilos" · "Plantillas y Skills" · footer usuario.
- **F1-T02** Crear `components/v2/shell/SidebarItemV2.tsx` (icono Lucide + label + badge opcional · estado expandido/colapsado · active state).
- **F1-T03** Crear `components/v2/shell/SidebarHilosList.tsx` que consume el hook existente de historial de threads (revisar `hooks/useAssistantHistory` o similar) + agrupa por fecha (Hoy/Ayer/Esta semana/Antes).
- **F1-T04** Crear `components/v2/shell/SidebarSkillsList.tsx` que consume `firm_skills` table via Supabase (skills del despacho actuales).
- **F1-T05** Crear `components/v2/shell/SidebarUserMenu.tsx` con DropdownMenu Shadcn (Configuración, Idioma, Ayuda, Plan, Cerrar sesión).
- **F1-T06** Crear `components/v2/shell/SidebarToggle.tsx` (botón colapsar/expandir con estado persistido en localStorage).
- **F1-T07** Modificar `components/layout/AppShell.tsx` (o equivalente) para que cuando `UX_V2_SHELL=true` use SidebarV2 en lugar del actual. CRÍTICO: no tocar el componente legacy.

### Tasks Cmd+K

- **F1-T08** Crear `components/v2/commandk/CommandPaletteV2.tsx` usando `cmdk` library (es lo que usa Linear/Vercel; Shadcn ya tiene wrapper `Command`).
- **F1-T09** Crear groups: Casos (#), Partes (@), Jueces (!), Skills (/), Documentos, Plazos, Jurisprudencia, Normativa, Comandos. Cada uno con su data source.
- **F1-T10** Wire de los 117 voice tools accesibles como comandos: leer registry desde el backend (endpoint `/api/v1/skills/tools` o equivalente) y exponerlos.
- **F1-T11** Atajo global `⌘K` / `Ctrl+K` con el hook `useHotkeys` o `@react-hook/keys`. Si Cmd+K ya está usado por algo, coordinar.
- **F1-T12** Atajos secundarios: `⌘N` nuevo caso, `⌘D` nuevo dictado, `⌘L` live canvas. Documentar en footer del palette.

### Migration helpers

- **F1-T13** Crear `lib/v2/itemMapping.ts` con el mapping completo de los 23 items actuales a sus destinos en v2 (algunos van a sidebar, otros a Cmd+K, otros a vistas dentro de casos). Esto asegura que ninguna funcionalidad se pierde.

### Testing F1

- **F1-TEST-01** Vitest: SidebarV2 renderiza los 5 items + sección hilos + sección skills.
- **F1-TEST-02** Vitest: SidebarToggle persiste estado en localStorage.
- **F1-TEST-03** Vitest: CommandPaletteV2 abre con Cmd+K y filtra por prefijo (`/`, `#`, `@`, `!`).
- **F1-TEST-04** Playwright: con `UX_V2_SHELL=true`, sidebar v2 visible; con `UX_V2_SHELL=false`, sidebar legacy visible.
- **F1-TEST-05** Playwright: navegación funcional — click en "Casos" → `/casos`, click en hilo → `/threads/[id]`.
- **F1-TEST-06** Playwright a11y: Tab navigation lineal en sidebar, focus visible, ARIA labels.
- **F1-TEST-07** Visual snapshot de sidebar expandido + colapsado.
- **F1-TEST-08** Suite de regresión legacy: con flag OFF, los 59 E2E actuales del backend pasan (porque el flag no toca backend).

### Checkpoint F1

✅ Si: sidebar v2 funcional, Cmd+K abre y busca, todos los items mapeados, flag OFF preserva legacy.
❌ Si: algún item sin destino, Cmd+K no encuentra los tools, flag OFF rompe layout actual.

---

## FASE 2 — Home Day Briefing thread (1 semana · riesgo bajo)

**Objetivo:** reemplazar la home actual (cards + métricas) por un thread proactivo del agente con el resumen del día.

### Tasks

- **F2-T01** Crear `lib/v2/dayBriefing.ts` con función `generateDayBriefing(firmId, userId)` que arma el contexto del día: audiencias hoy/mañana, plazos próximos 7 días, novedades del DO/jurisprudencia que afecten matters activos, casos urgentes (priority=alta).
- **F2-T02** Crear `components/v2/home/DayBriefingThread.tsx` que renderiza un thread tipo Claude con el mensaje proactivo + chips de sugerencias.
- **F2-T03** Crear `components/v2/home/SuggestionChip.tsx` (chip clickeable que envía un prompt al composer).
- **F2-T04** Crear `app/v2/inicio/page.tsx` que renderiza DayBriefingThread + Composer v2 (cuando F3 esté lista; mientras tanto, usar el composer actual).
- **F2-T05** Modificar `app/inicio/page.tsx` para que cuando `UX_V2_HOME=true` haga redirect a `/v2/inicio`, o renderice condicionalmente DayBriefingThread.
- **F2-T06** Endpoint backend opcional `/api/v1/day-briefing` que devuelve el JSON estructurado del día (audiencias, plazos, novedades). Puede ser SSR-only inicialmente.

### Testing F2

- **F2-TEST-01** Vitest: DayBriefingThread renderiza el mensaje del agente + chips.
- **F2-TEST-02** Vitest: SuggestionChip dispara onClick con el prompt correcto.
- **F2-TEST-03** Playwright: con flag ON, home muestra DayBriefingThread; con flag OFF, home muestra el dashboard legacy.
- **F2-TEST-04** Playwright: click en chip de sugerencia abre composer con el prompt prefilled.
- **F2-TEST-05** Visual snapshot de la home v2 (mañana, tarde, noche — variantes del saludo).
- **F2-TEST-06** Suite de regresión: con flag OFF, los 59 E2E siguen pasando.

### Checkpoint F2

✅ Si: home v2 muestra briefing real (no hardcoded), chips funcionales, flag OFF preserva dashboard.
❌ Si: briefing es estático, chips no envían prompt, layout rompe en mobile.

---

## FASE 3 — Composer v2 estilo Claude (1 semana · riesgo medio)

**Objetivo:** composer al fondo de cualquier thread con paridad visual Claude + 10 opciones del menú "+" (5 son deltas LexAI).

### Tasks

- **F3-T01** Crear `components/v2/composer/ComposerV2.tsx` con: textarea autosize, botón "+" abajo-izq, selector modelo, botón voz, botón send.
- **F3-T02** Crear `components/v2/composer/ComposerPlusMenu.tsx` (Popover Shadcn) con 10 opciones:
  1. Subir documento (PDF/Word) — abre file picker
  2. Adjuntar caso — abre selector con search de matters del firm
  3. Adjuntar parte — abre selector con search de clientes/contrapartes
  4. Adjuntar juez — abre selector con search de judges
  5. Adjuntar plazo — abre selector con search de deadlines próximos
  6. Skills (sub-menu) — /ask, /lex, /redactar/*, /revisar/*
  7. Búsqueda jurisprudencia (toggle)
  8. Conectores (sub-menu) — DIAN, Rama Judicial, IGAC, SICAAC
  9. Modo dictado — invoca voice agent
  10. Usar plantilla (sub-menu) — tutela, contrato, derecho de petición
- **F3-T03** Crear `components/v2/composer/ModelSelector.tsx` (DropdownMenu) con: gpt-4o, gpt-4-turbo, gpt-realtime, embedding-3-large + toggle pensamiento adaptativo.
- **F3-T04** Crear `components/v2/composer/VoiceRecorder.tsx` con waveform animado + timer + botones cancel/confirm. Usar `MediaRecorder` API + Web Audio API para waveform. Si ya existe en VoiceProvider, reutilizar.
- **F3-T05** Crear `components/v2/composer/AttachmentChip.tsx` (visualiza adjuntos antes de enviar: caso, parte, juez, plazo, doc).
- **F3-T06** Wire del composer al backend `/v1/skills/execute/stream`. Los attachments se serializan al `input_data.context` (matter_id, party_id, judge_id, deadline_id, doc_id).
- **F3-T07** Streaming token-by-token con cursor parpadeante (530ms timing como Claude).
- **F3-T08** Integrar ComposerV2 en DayBriefingThread (F2) y en cualquier thread futuro.

### Testing F3

- **F3-TEST-01** Vitest: ComposerV2 autosize hasta 8 líneas.
- **F3-TEST-02** Vitest: ComposerPlusMenu renderiza las 10 opciones.
- **F3-TEST-03** Vitest: ModelSelector cambia modelo con dropdown.
- **F3-TEST-04** Vitest: AttachmentChip muestra y elimina adjuntos.
- **F3-TEST-05** Playwright: subir documento PDF → chip aparece → enviar → backend recibe `doc_id`.
- **F3-TEST-06** Playwright: adjuntar caso → search filtra → click → chip + enviar → backend recibe `matter_id`.
- **F3-TEST-07** Playwright: dictar voz → waveform animado → confirm → texto transcrito en textarea.
- **F3-TEST-08** Playwright: streaming visible token-by-token con cursor parpadeante.
- **F3-TEST-09** Suite de regresión: el AssistantSidebar legacy con flag OFF sigue funcionando.

### Checkpoint F3

✅ Si: composer v2 envía prompts con attachments al backend, streaming funciona, voz transcribe.
❌ Si: attachments no llegan al backend, voz no captura audio, streaming se cuelga.

---

## FASE 4 — MatterArtifact (reemplazo de 16 tabs · 2 semanas · riesgo medio)

**Objetivo:** detalle de caso pasa de 16 tabs horizontales a un Artifact con secciones colapsables priorizadas por el agente.

### Tasks

- **F4-T01** Crear `components/v2/matter/MatterArtifact.tsx` (el contenedor principal).
- **F4-T02** Crear `lib/v2/matterPrioritization.ts` con función `prioritizeMatterSections(matter, deadlines, risks)` que decide qué secciones van expandidas por defecto según el contexto (ej. si hay audiencia en 7 días → Cronología expandida; si hay riesgo de prescripción → Riesgos expandida).
- **F4-T03** Crear `components/v2/matter/MatterHeader.tsx` (título serif + breadcrumb + status pill + CTA principal "Trabajar en canvas").
- **F4-T04** Crear `components/v2/matter/MatterExecutiveSummary.tsx` (resumen del caso generado por el agente — usa `/ask` con prompt específico de resumen ejecutivo).
- **F4-T05** Crear `components/v2/matter/MatterSection.tsx` (Accordion Shadcn con header + content + acciones contextuales).
- **F4-T06** Crear 16 sub-componentes (uno por cada tab actual) que viven dentro de `components/v2/matter/sections/`:
  1. ResumenSection
  2. AnalisisIASection
  3. CronologiaSection
  4. DocumentosSection
  5. PartesSection
  6. NotasSection
  7. CalendarioSection
  8. RiesgosSection
  9. CitasSection
  10. RefundamentacionSection
  11. HorasYGastosSection
  12. LeccionesSection
  13. ComentariosSection
  14. TareasSection
  15. JuezSection
  16. EvidenciaSection
  Cada uno reutiliza la data layer existente (TanStack hooks). UI nueva, data old.
- **F4-T07** Crear `app/v2/casos/[id]/page.tsx` que renderiza MatterArtifact.
- **F4-T08** Modificar `app/casos/[id]/page.tsx` para que con flag ON haga redirect a `/v2/casos/[id]`.

### Testing F4

- **F4-TEST-01** Vitest: MatterArtifact renderiza header + executive summary + 16 secciones (algunas expandidas, otras colapsadas).
- **F4-TEST-02** Vitest: prioritizeMatterSections devuelve la sección correcta según contexto (audiencia próxima → Cronología expandida).
- **F4-TEST-03** Vitest: cada uno de los 16 MatterSection renderiza su contenido correctamente.
- **F4-TEST-04** Playwright: con flag ON, abrir `/casos/[id]` → ver MatterArtifact con secciones colapsables.
- **F4-TEST-05** Playwright: cada sección funciona — añadir nota, ver documento, marcar plazo, etc.
- **F4-TEST-06** Playwright: tabbing por todas las secciones es accesible.
- **F4-TEST-07** Visual snapshot de cada sección expandida.
- **F4-TEST-08** Suite de regresión: con flag OFF, el detalle de caso actual con 16 tabs sigue funcionando (CRÍTICO).
- **F4-TEST-09** Cuenta de tools ejecutadas: comparar cuántas tools se llaman en flujo legacy vs v2 → no debe haber regresión.

### Checkpoint F4

✅ Si: MatterArtifact reemplaza visualmente los 16 tabs, todas las acciones (add note, mark deadline, etc.) funcionan idéntico, performance no regresiona.
❌ Si: alguna sección pierde funcionalidad, performance baja, tools no se llaman.

---

## FASE 5 — Canvas integrado al thread (1 semana · riesgo medio)

**Objetivo:** abrir un documento desde el thread divide la pantalla en thread (35-40%) + canvas TipTap (60-65%).

### Tasks

- **F5-T01** Crear `components/v2/canvas/ThreadCanvasSplit.tsx` (split view con resize handle).
- **F5-T02** Crear `components/v2/canvas/CanvasV2.tsx` que envuelve TipTap con toolbar minimalista (bold/italic/heading/list/cite/link).
- **F5-T03** Crear botones LexAI delta en toolbar:
  - "Verificar citas" → llama tool `verify_citations` y muestra resultados como sidebar lateral
  - "Detectar derogación" → llama tool `detect_derogation` y resalta normas derogadas
- **F5-T04** El agente puede editar el canvas vía tool calls visibles (ej. "LexAI está editando: añadiendo cláusula 3..." aparece como chip en el thread).
- **F5-T05** Sincronización en tiempo real con la 3-capas de sync (Supabase Realtime ya implementado en sprint anterior).
- **F5-T06** Crear `app/v2/canvas/[docId]/page.tsx` que renderiza ThreadCanvasSplit.

### Testing F5

- **F5-TEST-01** Vitest: ThreadCanvasSplit renderiza thread + canvas con resize handle funcional.
- **F5-TEST-02** Vitest: toolbar TipTap funciona (bold/italic/etc.).
- **F5-TEST-03** Playwright: abrir doc desde thread → split aparece → editar canvas → cambios se persisten.
- **F5-TEST-04** Playwright: click "Verificar citas" → loader → resultados aparecen → citas inválidas resaltadas.
- **F5-TEST-05** Playwright: agente edita canvas → cambio aparece en tiempo real.
- **F5-TEST-06** Visual snapshot del split.
- **F5-TEST-07** Suite de regresión: con flag OFF, canvas actual sigue funcionando.

### Checkpoint F5

✅ Si: split funciona, canvas edita, verifica citas y detecta derogación.
❌ Si: pierde cambios al cambiar de tab, verify_citations rompe, sync no funciona.

---

## FASE 6 — Dark mode + Accesibilidad AAA (1 semana · riesgo bajo)

**Objetivo:** activar dark mode (paleta espejo deliberada) y cumplir WCAG AAA en componentes v2.

### Tasks Dark mode

- **F6-T01** Definir paleta dark en `styles/tokens-v2.css` con `:root.dark` o `[data-theme="dark"]`. Cada token tiene su variante dark.
- **F6-T02** Crear `hooks/useThemeV2.ts` que persiste preferencia en localStorage + respeta `prefers-color-scheme`.
- **F6-T03** Crear `components/v2/shell/ThemeToggle.tsx` (toggle en sidebar footer o user menu).
- **F6-T04** Cross-fade transition al cambiar tema (no flash blanco).
- **F6-T05** Verificar TODOS los componentes v2 en dark mode (snapshot review).

### Tasks Accesibilidad AAA

- **F6-T06** Audit con axe-core sobre todas las páginas v2 → 0 violaciones AAA.
- **F6-T07** Contraste 7:1 en texto principal (verificar con DevTools/Lighthouse).
- **F6-T08** Focus rings visibles en TODOS los interactivos (no removidos).
- **F6-T09** ARIA roles + labels correctos en composer, thread, artifacts, sidebar.
- **F6-T10** Atajos de teclado documentados (mostrar en Cmd+K?).
- **F6-T11** Soporte `prefers-reduced-motion` en todas las animaciones (Framer Motion + CSS).
- **F6-T12** Live regions para streaming de texto (screen reader anuncia tokens entrantes sin saturar).
- **F6-T13** Opción tipografía dyslexia-friendly (OpenDyslexic) en user menu.

### Testing F6

- **F6-TEST-01** Vitest: useThemeV2 persiste y respeta prefers-color-scheme.
- **F6-TEST-02** Playwright: toggle tema cambia paleta con cross-fade.
- **F6-TEST-03** axe-core sobre `/v2-showcase`, `/v2/inicio`, `/v2/casos/[id]`, `/v2/canvas/[docId]` → 0 violaciones AAA.
- **F6-TEST-04** Playwright: navegar con Tab → focus visible en cada interactivo.
- **F6-TEST-05** Playwright: con `prefers-reduced-motion: reduce` → animaciones reducidas.
- **F6-TEST-06** Lighthouse Accessibility ≥ 100 en las 4 páginas v2 principales.
- **F6-TEST-07** Visual snapshot light + dark de las 4 páginas v2.

### Checkpoint F6

✅ Si: dark mode funciona, AAA passes, focus rings visibles, reduced-motion respetado.
❌ Si: dark mode rompe contraste, axe-core reporta violaciones, focus invisible.

---

## FASE FINAL — Switch a producción + cleanup (2-3 días)

**Solo después de que las 6 fases pasen sus checkpoints.**

- **FF-T01** Reunión de validación con el usuario: navegar la app con todos los flags ON.
- **FF-T02** Activar TODOS los flags por default en Vercel env vars.
- **FF-T03** Marcar componentes legacy como deprecated (comentario `// @deprecated · reemplazado por components/v2/*`).
- **FF-T04** Plan de eliminación de legacy en sprint posterior (no en este).
- **FF-T05** Documentar en CHANGELOG.md el rollout v2.
- **FF-T06** Anunciar a usuarios beta para feedback (si aplica).

---

## Métricas de éxito a medir post-rollout

- Time-to-first-action (login → primer prompt enviado): baseline vs v2.
- Depth-of-clicks-per-task (crear caso, encontrar doc, etc.).
- % uso del agente vs sidebar (idealmente >70% del tráfico via composer).
- NPS de abogados beta.
- Abandono en flujos críticos (audiencia, redacción).
- Performance: TTI, LCP, FID en las 4 páginas principales.

---

## Estrategia de rollback (idéntica al modelo ADR-007)

Si en cualquier punto algo rompe, bajar el flag correspondiente:
- `NEXT_PUBLIC_UX_V2_HOME=false` → vuelve dashboard legacy
- `NEXT_PUBLIC_UX_V2_MATTER=false` → vuelven los 16 tabs
- etc.

Cambio en Vercel + redeploy < 5 minutos. Componentes legacy permanecen tocables hasta la Fase Final.

---

## Restricciones a respetar (toman precedencia)

- NO tocar `components/canvas/*` actual hasta Fase 5 (y ahí solo se wraps, no se modifican)
- NO tocar `components/assistant/MarkdownContent.tsx` (safety net del personality assembler)
- NO tocar `lib/hooks/useDataChangeRefresh.ts` ni `useDataInvalidation.ts` ni `useTableSubscription.ts` (las 3 capas de sync del sprint anterior)
- NO tocar los 117 voice tools del backend
- NO tocar `utils/persona_assembler.py` ni `skill_runner.py` ni `voice.py` (backend personality)
- Los 59 E2E + 14 smoke de personalidad deben seguir pasando en cada checkpoint
