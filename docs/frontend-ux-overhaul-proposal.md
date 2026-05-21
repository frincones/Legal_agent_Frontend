# LexAI · Propuesta de Rediseño UX/UI — "Conversation-First Legal OS"

**Fecha:** 2026-05-20  
**Autor:** UX/UI Designer Agent — LexAI  
**Estado:** DRAFT — pendiente aprobación del paradigma antes de codificar  
**Audiencia:** Freddy Rincones (Tech Lead), equipo de producto LexAI

---

## RESUMEN EJECUTIVO (1 página para decisión)

LexAI tiene hoy una arquitectura de navegación de herramienta (23 items en sidebar, 16 tabs en el detalle de caso) que compite directamente con el flujo de trabajo del abogado en lugar de integrarse en él. Claude.ai y ChatGPT ganaron la mente del usuario con un patrón radicalmente distinto: una sola caja de texto que lo puede todo, historial visible a la izquierda, y nada más en pantalla que distrae.

La ventaja de LexAI no es su UI — es que conoce al despacho. Sabe qué casos tiene Freddy, cuándo vence el plazo del caso Pérez vs López, qué juez lo va a ver, qué normas están vigentes y cuáles fueron derogadas. Esa ventaja hoy está enterrada bajo 23 items de menú.

**La propuesta:** adoptar el paradigma **Conversation-First con Artifacts Contextuales**, donde la conversación con LexAI es el punto de entrada único, y las vistas de caso/documento/calendario emergen como "artifacts" ancla dos a los threads — similar a cómo Claude genera artifacts de código o documentos, pero con datos reales del despacho colombiano.

**Qué gana el abogado:** abre LexAI y ve su día resumido en prosa por el agente, con un composer prominente. Todo lo demás — los 16 tabs, los 23 módulos, las 117 tools — está a una pregunta de distancia, no a un click en el sidebar.

**Qué no se pierde:** ninguna funcionalidad. Todos los módulos siguen existiendo; simplemente se acceden vía conversación, Cmd+K, o links desde los artifacts que el agente genera.

**Decisión requerida:** aprobar el paradigma "Conversation-First" antes de iniciar la fase de wireframes detallados y código.

---

## SECCIÓN 1 — DIAGNÓSTICO EXPERTO

### 1.1 Los 7 problemas críticos actuales

---

**PROBLEMA 1: Cognitive overload del sidebar (23 items)**

*Qué duele al abogado:* Un abogado litigante tiene entre 20 y 80 casos activos. Cuando abre LexAI a las 7am antes de una audiencia, el cerebro tiene que escanear 23 opciones antes de encontrar lo que necesita. La neurociencia cognitiva llama a esto "choice paralysis" — con más de 7 opciones primarias el tiempo de decisión se multiplica (Ley de Hick-Hyman).

*Qué pasa con Claude/ChatGPT:* Claude.ai tiene 4 items en toda su navegación: Nuevo chat, Historial de chats, Proyectos, y Perfil. El abogado que usa Claude para redactar escritos nunca tiene que pensar "¿en qué módulo está esto?" — simplemente escribe.

*Evidencia en el código:* `Sidebar.tsx` define 24 `SidebarKey` con items como `actividad`, `menciones`, `insights`, `automation` — todos ellos accesibles de mejor forma vía conversación.

*Por qué es crítico:* es el primer impacto visual. Si el abogado ve 23 items al entrar, asocia LexAI con "otra app corporativa compleja que debo aprender" — exactamente lo opuesto a Claude que asocia con "le pregunto y me responde".

---

**PROBLEMA 2: 16 tabs en el detalle de caso — información oculta sin jerarquía**

*Qué duele al abogado:* El abogado no sabe que la tab "Refundamentación" existe ni para qué sirve. Las tabs `Lecciones`, `Evidencia`, `Juez`, `Horas y Gastos` requieren onboarding que nadie recibió. El patrón horizontal overflow en móvil es directamente inutilizable.

*Qué pasa con Claude/ChatGPT:* Claude no tiene tabs. Cuando el abogado le pregunta "¿qué documentos tengo en el caso Pérez?" — Claude responde con una lista. La información aparece cuando la necesitas, no está escondida en una pestaña que tienes que encontrar.

*Evidencia en el código:* `MatterTabs.tsx` lista 16 tabs en `MATTER_TABS`. Cada tab añadida en sprints sucesivos (Sprint 2, Sprint 8, Sprint 15, Sprint 16, Sprint 17, Sprint 20, Sprint 21) sin revisión de la jerarquía total.

*Por qué es crítico:* el caso es el objeto central de trabajo del abogado. Si la pantalla más importante de la app es confusa, toda la app es confusa.

---

**PROBLEMA 3: Duplicidad de entry points — el abogado no sabe cuál es la acción primaria**

*Qué duele al abogado:* En la pantalla de Inicio actual existen simultáneamente: VoiceHUD flotante en el centro-inferior, AssistantSidebar en el borde derecho (cuando está habilitado), campo de búsqueda en el sidebar, SidebarSearchTrigger que abre Cmd+K, y múltiples botones CTA (Nuevo caso, Subir documento, etc.). Hay al menos 4 formas de "hablar con LexAI" y ninguna es obvia.

*Qué pasa con Claude/ChatGPT:* hay exactamente un composer, centrado, con placeholder claro. El cerebro del usuario nunca tiene que decidir dónde escribir.

*Evidencia en el código:* `layout.tsx` monta `VoiceHUD` + `CommandPalette` + opcionalmente `AssistantProvider` (con su propio composer). Tres entry points de interacción compitiendo.

*Por qué es crítico:* la curva de onboarding se dispara. El abogado prueba LexAI 2-3 veces, no entiende el flujo, y vuelve a Claude.

---

**PROBLEMA 4: Home/Inicio es un dashboard de métricas, no una herramienta de trabajo**

*Qué duele al abogado:* La página de inicio muestra "Documentos verificados: 0/40", "Horas ahorradas: 0h", "Voice/semana: 0", "Citas verificadas: 100%". Para un abogado que acaba de entrar a trabajar, estas métricas son irrelevantes. Lo que necesita es: ¿qué tengo que hacer hoy? ¿hay algún plazo que se me esté yendo?

*Qué pasa con Claude/ChatGPT:* no hay dashboard. Hay un saludo contextual y un composer. "¿En qué puedo ayudarte hoy?" Lo que le interesa al usuario.

*Evidencia en el código:* `inicio/page.tsx` renderiza un grid con `Stat` components (documentos_verificados_mes, voice_commands_semana, horas_ahorradas_mes, citas_verificadas_pct) y una `Greeting` con mensaje hardcodeado sobre el caso urgente — información correcta pero presentada en el formato equivocado.

*Por qué es crítico:* la primera pantalla define la propuesta de valor. Si el abogado ve métricas de uso en lugar de ayuda concreta, LexAI se clasifica mentalmente como "herramienta de analytics" no como "asistente legal".

---

**PROBLEMA 5: AssistantSidebar y VoiceHUD son elementos superpuestos que reducen el viewport**

*Qué duele al abogado:* El AssistantSidebar (cuando está expandido) es un overlay flotante fijo sobre el contenido principal. El VoiceHUD es otro elemento flotante fijo centrado abajo. En un laptop de 13" con el sidebar izquierdo abierto (248px) más el assistant sidebar derecho (expandido), el contenido principal puede quedar con menos de 600px de ancho — en tablas legales con muchas columnas esto es catastrófico.

*Qué pasa con Claude/ChatGPT:* el chat ES la pantalla completa. No hay elementos flotantes compitiendo con el contenido.

*Evidencia en el código:* `AppShell.tsx` define `grid-cols-[248px_1fr]`. El `AssistantSidebar` es `position: fixed` derecho. El `VoiceHUD` es `position: fixed bottom-[16px] left-1/2`. Tres capas de layout que no están coordinadas.

*Por qué es crítico:* el abogado trabaja con documentos largos y tablas de hechos. Un viewport reducido lo obliga a hacer scroll horizontal, lo que rompe el flujo cognitivo.

---

**PROBLEMA 6: La identidad de LexAI como agente no es visible — parece una app, no un asistente**

*Qué duele al abogado:* La personalidad "Dr./Dra. LexAI v1" (10 módulos STATIC + 8 DYNAMIC, persona cordial usted-formal) que se construyó en el último sprint vive en el backend — pero en el frontend no se percibe. El abogado no "siente" que hay un asistente inteligente que lo conoce. Ve formularios, tablas y tabs como en cualquier otro software.

*Qué pasa con Claude/ChatGPT:* la presencia del agente es omnipresente. Cada respuesta recuerda que hay inteligencia del otro lado. Claude incluye razonamiento visible, ChatGPT muestra el "thinking" con streaming de tokens.

*Evidencia en el código:* `AssistantThread.tsx` y `ThinkingStep.tsx` existen y hacen streaming, pero están escondidos detrás de un toggle del sidebar derecho. El 90% del tiempo el abogado ve LexAI como una app tradicional sin agente.

*Por qué es crítico:* LexAI cobra por ser un asistente AI. Si no se percibe el AI, no se percibe el valor diferencial.

---

**PROBLEMA 7: Nomenclatura inconsistente y terminología técnica expuesta**

*Qué duele al abogado:* Items como "Insights" (anglicismo), "Live Canvas", "KB" (knowledge base — jerga tecnológica), "Trust" (fondos cliente — confuso), "Intake forms" (anglicismo), "Marketplace". Un abogado colombiano de 45 años no debería tener que adivinar qué es "Trust" o por qué hay un "Marketplace" en su software legal.

*Qué pasa con Claude/ChatGPT:* la UI habla el idioma del usuario. "Nuevo chat", "Historial", "Proyectos". Simplicidad radical.

*Evidencia en el código:* `Sidebar.tsx` lista labels como `'Conocimiento'`, `'Live Canvas'`, `'Fondos cliente'`, `'Insights'`, `'Marketplace'`, `'Intake forms'` — mezcla de español, inglés y términos técnicos.

*Por qué es crítico:* el abogado tiene que confiar en su herramienta. La inconsistencia de lenguaje genera fricción cognitiva y desconfianza.

---

## SECCIÓN 2 — INVESTIGACIÓN COMPETITIVA

### 2.1 Claude.ai (claude.ai)

**Patrón de navegación:**
- Sidebar izquierdo: Nuevo chat | Historial de chats (por fecha: Hoy, Ayer, Esta semana) | Proyectos | Perfil. Total: 4 conceptos.
- Proyectos: carpetas que agrupan conversaciones con contexto compartido (system prompt + archivos). Equivalente funcional a los "matters" de LexAI.
- Sin tabs. Sin módulos. Sin dashboard.

**Cómo conviven chat y workspace:**
- El chat ES el workspace. Cuando Claude genera código, aparece como un "artifact" en un panel derecho deslizable. Los artifacts pueden ser: código, documentos, visualizaciones. El usuario puede editar el artifact directamente.
- Para LexAI: los artifacts serían "Resumen de caso", "Borrador de tutela", "Timeline de cronología", "Riesgos identificados" — generados por el agente en respuesta a una pregunta, no en tabs fijas.

**Archivos/Proyectos:**
- Los archivos se adjuntan a la conversación (no hay repositorio separado).
- Los Proyectos tienen "Instrucciones del proyecto" (equivalente al system prompt de firma) y "Conocimiento del proyecto" (documentos base).
- Para LexAI: cada caso = un Proyecto. Los documentos del caso se adjuntan al Proyecto.

**Skills/Agentes:**
- Claude no tiene skills explícitos en la UI — todo es conversación.
- Lo más cercano: el botón "+" para adjuntar archivos/imágenes, y los "styles" de respuesta (Concise, Normal, Detailed).

**Qué AMA el usuario:** la ausencia de fricción. No hay que aprender rutas. No hay que recordar dónde está algo. Solo escribir.

---

### 2.2 ChatGPT (chatgpt.com)

**Patrón de navegación:**
- Sidebar izquierdo (colapsable): Nuevo chat | Explorar GPTs | Historial (por fecha). Área de usuario abajo.
- "Custom GPTs" (= Skills): accesibles vía el campo de composición (botón "+" o "@nombre-gpt"). No son items de sidebar.
- Sidebar colapsable con un click — cuando colapsa, el chat ocupa el 100% de la pantalla.

**Cómo conviven chat y workspace:**
- ChatGPT tiene "Canvas" (similar a Claude artifacts) para documentos y código. El canvas aparece como panel derecho cuando el contenido lo justifica — no siempre visible.
- La pantalla principal siempre es la conversación. El canvas es contextual.

**Archivos/Proyectos:**
- "Projects" (feature reciente): organiza conversaciones y adjuntos. Los archivos del proyecto están disponibles en todas las conversaciones del proyecto.
- Para LexAI: directa traducción al sistema de matters.

**Skills/Agentes:**
- GPTs personalizados accesibles con "@" en el composer. El usuario escribe "@redactar" y aparecen las opciones.
- Para LexAI: "@redactar/tutela", "@revisar/contrato", "@calcular/liquidacion" — exactamente el sistema de skills que ya existe pero accesible desde el composer principal.

**Qué AMA el usuario:** el "@mention" para invocar skills sin salir del composer. Es intuitivo, familiar (igual que Discord/Slack).

---

### 2.3 Gemini Pro / AI Studio

**Patrón de navegación:**
- Sidebar con Historial de conversaciones, acceso a "Gems" (= GPTs personalizados).
- AI Studio: modelo de "System instruction" + "User turn" visible. Más técnico, pero muestra el paradigma de contexto explícito.
- Integración con Google Workspace: adjunta docs de Google Drive directamente.

**Qué AMA el usuario:** la integración con documentos de trabajo existentes. No hay que subir archivos — están en Drive.

---

### 2.4 Productos SaaS Legales Modernos

**Harvey AI (harvey.ai)**
- Interface: chat-first. Sidebar izquierdo con "Matters" (= casos) y "Documents".
- Cada Matter es un thread de conversación + biblioteca de documentos.
- Generación de documentos: el AI redacta en un panel derecho que el abogado puede editar directamente (como Claude artifacts pero con tracking de cambios legal).
- Búsqueda: Cmd+K global que busca across matters y documents.
- Lo que AMA el abogado: Harvey "recuerda" el contexto del caso entre conversaciones. No hay que repetir hechos.
- Lección para LexAI: el matter como contexto persistente de conversación es EL patrón correcto.

**Legora (legora.ai) — Suecia, líderes en EU**
- Interface: workspace de documentos + sidebar de AI. El documento es el centro, el AI comenta y sugiere en el margen.
- Para LexAI: el Canvas TipTap ya implementa esto parcialmente.
- Lo que AMA el abogado: el AI trabaja EN el documento, no en una ventana separada.

**EvenUp (evenuplaw.com) — demand letters personales**
- Interface: intake form wizard → generación automática → revisión del abogado.
- Highly opinionated: un solo flujo, sin sidebar de navegación.
- Lección para LexAI: para tareas específicas (redactar tutela, calcular liquidación), un flujo guiado sin opciones es mejor que navegación libre.

**Spellbook (spellbook.legal) — contratos**
- Interface: plugin de Word + web sidebar. El AI vive donde vive el documento.
- CommandPalette para invocar acciones: "Revisar cláusula", "Detectar riesgos", "Sugerir alternativa".
- Lección para LexAI: la Command Palette (ya implementada con `cmdk`) es el patrón correcto para acciones rápidas sin UI dedicada.

**CoCounsel by Casetext (ahora Thomson Reuters)**
- Interface: chat con el expediente adjunto. El AI responde citando partes del documento.
- Diferenciador: "Draft" y "Review" como acciones primarias, no como módulos separados.
- Lección para LexAI: las skills deberían ser verbos (Redactar, Revisar, Calcular, Buscar) no sustantivos (Canvas, Marketplace, Insights).

---

## SECCIÓN 3 — PROPUESTA DE PARADIGMA

### Opción A: "Conversation-First" (Harvey AI / Claude.ai-like)

**Descripción:** La conversación con LexAI es el punto de entrada único. La pantalla principal es un composer prominente. Las vistas de caso, documentos, calendario etc. emergen como "artifacts" anclados a la conversación cuando el agente los genera.

**Pros:**
- Cero curva de aprendizaje: el abogado sabe usar chat.
- Las 117 tools son invocables de forma natural sin que el abogado sepa que existen.
- La personalidad de LexAI (Dr./Dra., usted-formal, NO Markdown crudo) brilla en cada interacción.
- Elimina la pregunta "¿dónde está X?" — simplemente pregunta "¿qué tengo hoy?".
- Máxima diferenciación vs Claude: LexAI "sabe" de tus casos; Claude, no.

**Contras:**
- Los abogados que prefieren navegar visualmente (buscar un caso en una lista) necesitan un path secundario claro.
- Datos tabulares densos (lista de 80 casos con filtros complejos) son difíciles de presentar en conversación.
- Migración requiere cambiar el mental model del sidebar actual.

---

### Opción B: "Workspace-First" (Notion/Linear-like)

**Descripción:** Los casos son páginas vivas con bloques editables (similar a Notion). El AI es un sidebar contextual que asiste mientras el abogado navega la base de datos de casos.

**Pros:**
- Alta densidad de información visible (tablas, filtros, vistas Kanban de casos).
- Familiar para usuarios de herramientas como Monday, Notion, Linear.
- El abogado "ve" todo su portafolio de casos en una vista.

**Contras:**
- Poco diferenciado de software legal tradicional (Clio, MyCase, etc.).
- No aprovecha la fortaleza principal de LexAI: el agente conversacional.
- Requiere mucho onboarding para configurar vistas y filtros.
- No compite con Claude/ChatGPT — es una herramienta diferente.

---

### Opción C: "Hybrid Canvas" (Figma-like)

**Descripción:** Canvas infinito donde cada caso es un bloque visual. El chat es un panel flotante invocable con Cmd+Space. Los documentos se abren en el canvas principal.

**Pros:**
- Visualmente impresionante. El "wow" factor es alto.
- Permite ver relaciones entre casos y documentos espacialmente.

**Contras:**
- Complejidad de implementación muy alta (nuevo paradigma desde cero).
- Los abogados no están familiarizados con canvas infinitos (ese es el mundo de diseñadores).
- La density de información requerida por los abogados (listas densas) no encaja en un canvas espacial.
- El TipTap canvas ya existe y es diferente — habría conflicto conceptual.

---

### RECOMENDACION: Opción A — "Conversation-First con Artifacts Contextuales"

**Justificación:**

1. **Alineación con el mental model ganador:** el abogado ya usa Claude. Migrar a LexAI bajo el mismo paradigma de conversación elimina la resistencia al cambio. La pregunta pasa de "¿cómo uso LexAI?" a "¿le pregunto lo mismo que le pregunto a Claude, pero LexAI ya sabe de mis casos?"

2. **Máximo aprovechamiento del stack existente:** el `AssistantSidebar`, `AssistantThread`, `AssistantComposer` ya existen y funcionan. La arquitectura de streaming (skill_runner, ui_command_bus, TanStack invalidator) ya está lista. El paradigma Conversation-First los pone al frente en lugar de esconderlos.

3. **Los artifacts resuelven el problema de densidad:** cuando el abogado pregunta "muéstrame mis casos de tutela", LexAI genera un artifact interactivo (tabla filtrada, cards, o timeline) anclado al thread. Es la misma información que hoy está en los 16 tabs, pero aparece cuando se necesita.

4. **Diferenciación máxima vs Claude:** Claude no puede generar un artifact con los plazos de tus 40 casos activos ordenados por urgencia. LexAI sí. Esa es la propuesta de valor que se hace obvia desde el primer minuto.

5. **Path de migración factible:** el sidebar se simplifica a 5 items (conservando los módulos secundarios como paths de URL accesibles vía Cmd+K). Los 16 tabs del caso se convierten en el primer mensaje del thread del caso: un resumen estructurado que el abogado puede expandir conversacionalmente.

---

## SECCIÓN 4 — WIREFRAMES ASCII

### 4.1 Pantalla Home / Día del abogado

```
┌─ LexAI ────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌── Sidebar (196px) ──┐  ┌── Área principal ─────────────────────────────┐│
│  │                     │  │                                               ││
│  │  [L] LexAI          │  │                                               ││
│  │  Rincones & Asoc.   │  │                                               ││
│  │  ─────────────────  │  │                                               ││
│  │                     │  │   ┌── Thread del día ──────────────────────┐  ││
│  │  + Nueva consulta   │  │   │                                        │  ││
│  │                     │  │   │  LexAI · hoy, 7:02am                   │  ││
│  │  ─────────────────  │  │   │  ─────────────────────────────────────  │  ││
│  │                     │  │   │  Buenos días, doctor Rincones.         │  ││
│  │  Hoy                │  │   │                                        │  ││
│  │  · Caso Pérez ...   │  │   │  Tiene tres asuntos urgentes:          │  ││
│  │  · [Nuevo thread]   │  │   │                                        │  ││
│  │                     │  │   │  [ARTIFACT: Agenda del día]            │  ││
│  │  Esta semana        │  │   │  ┌────────────────────────────────┐    │  ││
│  │  · Revisión tutela  │  │   │  │ HOY · Martes 20 de mayo        │    │  ││
│  │  · Calculo liquid.  │  │   │  │ ─────────────────────────────  │    │  ││
│  │  · ...              │  │   │  │ ! Audiencia · Pérez vs López   │    │  ││
│  │                     │  │   │  │   Juzgado 3° Civil · 9:00am    │    │  ││
│  │  Casos (23 activos) │  │   │  │   → [Abrir caso]               │    │  ││
│  │                     │  │   │  │                                │    │  ││
│  │  ─────────────────  │  │   │  │ ! Vencimiento traslado DDA     │    │  ││
│  │                     │  │   │  │   Caso Banco X · mañana 5pm    │    │  ││
│  │  [⚙] Configuración  │  │   │  │   → [Ver caso] [Redactar]      │    │  ││
│  │  [?] Doctor Freddy  │  │   │  │                                │    │  ││
│  └─────────────────────┘  │   │  │ → Juicio oral · Caso García    │    │  ││
│                            │   │  │   Jueves 22 · 2:00pm           │    │  ││
│                            │   │  └────────────────────────────────┘    │  ││
│                            │   │                                        │  ││
│                            │   │  Además, desde ayer:                   │  ││
│                            │   │  LexAI identificó 2 cambios           │  ││
│                            │   │  normativos que afectan sus casos      │  ││
│                            │   │  laborales. ¿Quiere revisarlos?        │  ││
│                            │   │                                        │  ││
│                            │   │  [Sí, muéstramelos]  [Más tarde]      │  ││
│                            │   │                                        │  ││
│                            │   └────────────────────────────────────────┘  ││
│                            │                                               ││
│                            │  ┌── Composer ────────────────────────────────┐││
│                            │  │                                            │││
│                            │  │  Pregúntele algo a LexAI o use /skill...  │││
│                            │  │                                   [Mic] [→]│││
│                            │  └────────────────────────────────────────────┘││
│                            └───────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- Sidebar izquierdo: 196px, 5 conceptos máximo. Historial de threads por fecha (como Claude).
- El área principal es el thread. El primer mensaje del día lo genera LexAI automáticamente con datos reales del despacho.
- Los "Artifacts" son cards interactivos anclados al thread. Tienen acciones secundarias ([Abrir caso], [Redactar]).
- El Composer es prominente, centrado en el área principal. Un solo punto de entrada.
- VoiceHUD integrado en el Composer (botón [Mic]) — no flotante separado.

---

### 4.2 Detalle de caso (reemplazo de los 16 tabs)

```
┌─ LexAI · Casos · Pérez vs López Financiera ────────────────────────────────┐
│                                                                             │
│  ┌── Sidebar ──────────┐  ┌── Caso: Pérez vs López ────────────────────────┐│
│  │  [←] Casos          │  │                                               ││
│  │  ─────────────────  │  │  ┌── Thread del caso ──────────────────────┐  ││
│  │  Pérez vs López  ●  │  │  │                                        │  ││
│  │  ─────────────────  │  │  │  LexAI · 12 may, 3:22pm               │  ││
│  │  Conversaciones:    │  │  │  ─────────────────────────────────────  │  ││
│  │  · Resumen inicial  │  │  │  Caso: Pérez vs López Financiera S.A.  │  ││
│  │  · Tutela redactada │  │  │  Exp. 2024-0412 · Juzgado 3° Civil    │  ││
│  │  · Revisión riesgos │  │  │  Bogotá · Etapa: Alegatos de conclusión│  ││
│  │  · [Nueva consulta] │  │  │                                        │  ││
│  │                     │  │  │  [ARTIFACT: Estado del caso]           │  ││
│  │  ─────────────────  │  │  │  ┌─────────────────────────────────┐   │  ││
│  │  Accesos directos:  │  │  │  │ Cuantía: $48.500.000            │   │  ││
│  │  · Ver documentos   │  │  │  │ Plazo crítico: 3 días           │   │  ││
│  │  · Abrir en Canvas  │  │  │  │ Partes: 2 (demandante/demandado)│   │  ││
│  │  · Calcular term.   │  │  │  │ Documentos: 7 · 2 sin revisar   │   │  ││
│  │                     │  │  │  │ Riesgo: ALTO · prescripción     │   │  ││
│  │                     │  │  │  └─────────────────────────────────┘   │  ││
│  │                     │  │  │                                        │  ││
│  │                     │  │  │  El caso tiene un riesgo alto de       │  ││
│  │                     │  │  │  prescripción. El plazo del Art. 488   │  ││
│  │                     │  │  │  CST vence en 3 días. Le recomiendo    │  ││
│  │                     │  │  │  presentar la demanda esta semana.     │  ││
│  │                     │  │  │                                        │  ││
│  │                     │  │  │  ¿Desea que redacte el memorial o     │  ││
│  │                     │  │  │  que calcule la liquidación exacta?   │  ││
│  │                     │  │  │                                        │  ││
│  │                     │  │  │  [Redactar memorial] [Calcular]        │  ││
│  │                     │  │  │  [Ver cronología]    [Ver documentos]  │  ││
│  │                     │  │  │                                        │  ││
│  │                     │  │  │  ─ usted · hace 2 días ─────────────  │  ││
│  │                     │  │  │  Necesito el análisis del juez         │  ││
│  │                     │  │  │                                        │  ││
│  │                     │  │  │  ─ LexAI · hace 2 días ─────────────  │  ││
│  │                     │  │  │  [ARTIFACT: Perspectiva del Juez]      │  ││
│  │                     │  │  │  ┌─────────────────────────────────┐   │  ││
│  │                     │  │  │  │ Juez: Dr. Hernández Pérez       │   │  ││
│  │                     │  │  │  │ Tasa de fallo favorable: 67%    │   │  ││
│  │                     │  │  │  │ Tiempo promedio: 8 meses        │   │  ││
│  │                     │  │  │  └─────────────────────────────────┘   │  ││
│  └─────────────────────┘  │  │                                        │  ││
│                            │  └────────────────────────────────────────┘  ││
│                            │                                               ││
│                            │  ┌── Composer ────────────────────────────────┐││
│                            │  │  Pregúntele a LexAI sobre este caso...    │││
│                            │  │                              [Adjuntar][→] │││
│                            │  └────────────────────────────────────────────┘││
│                            └───────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- Los 16 tabs desaparecen. En su lugar: un thread de conversación contextual al caso.
- El estado del caso es un Artifact siempre visible al inicio del thread (como un "pinned message").
- Cada "tab" anterior se convierte en información que LexAI entrega cuando se le pregunta o como Artifact generado.
- "Ver cronología", "Ver documentos" son acciones que generan nuevos Artifacts en el thread.
- El sidebar izquierdo muestra el historial de conversaciones de ESTE caso (no navegación global).

---

### 4.3 Documento abierto en Canvas (TipTap)

```
┌─ LexAI · Canvas · Tutela DDA vs Banco X ───────────────────────────────────┐
│                                                                             │
│  ┌── Barra superior ─────────────────────────────────────────────────────┐ │
│  │  [←] Caso DDA    │  Tutela DDA vs Banco X   │  [Guardar v3] [Firmar] │ │
│  │  ─────────────── │  ─────────────────────── │  Verificadas: 8/10 ●   │ │
│  │  B I U  H1 H2 ¶  │  Sans · Serif ▼  12pt ▼  │  [Lex] [Historial]     │ │
│  └──────────────────────────────────────────────────────────────────────-┘ │
│                                                                             │
│  ┌── Editor TipTap (70%) ────────────────────────────┐  ┌── Panel IA (30%)┐│
│  │                                                   │  │                ││
│  │  ACCIÓN DE TUTELA                                 │  │  LexAI         ││
│  │  ─────────────                                    │  │  ─────────────  ││
│  │                                                   │  │                ││
│  │  SEÑOR(A) JUEZ:                                   │  │  Revisando...  ││
│  │                                                   │  │                ││
│  │  DIANA ALEJANDRA DÍAZ ARDILA, identificada con   │  │  Citas:        ││
│  │  C.C. 52.347.891, actuando en nombre propio...    │  │                ││
│  │                                                   │  │  ● T-076/2019  ││
│  │  HECHOS                                           │  │  verificada    ││
│  │  ───────                                          │  │                ││
│  │  1. El día 15 de febrero de 2026, el Banco X     │  │  ● T-411/2020  ││
│  │     procedió a debitar de manera unilateral...    │  │  verificada    ││
│  │                                                   │  │                ││
│  │  2. Según la sentencia T-587/2021 [verificada ●] │  │  ⚠ SU-354/2024 ││
│  │     el derecho al mínimo vital...                 │  │  superada      ││
│  │                                                   │  │                ││
│  │  3. El Decreto 1234/2022 [pendiente ○] establece │  │  ─────────────  ││
│  │     que las entidades bancarias...                │  │                ││
│  │                                                   │  │  [Pregúntele   ││
│  │  █ (cursor AI escribiendo)                        │  │   algo a LexAI ││
│  │                                                   │  │   sobre este   ││
│  │  ─────────────────────────────────────────────── │  │   documento...]││
│  │  Palabras: 1,847 · Páginas: ~6 · Guardado 2s     │  │                ││
│  └───────────────────────────────────────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- El editor TipTap ocupa 70% del ancho. El panel de citas + chat ocupa 30%.
- La barra de formato es compacta — solo lo esencial, no Word completo.
- Las citas verificadas/superadas son inline badges (ya implementados en `.cite-verified`).
- El panel IA derecho unifica: citas verificadas, chat contextual al documento.
- Sin sidebar izquierdo completo — solo breadcrumb "[←] Caso DDA" para volver.
- "AI escribiendo" se muestra con un cursor parpadeante (ya implementado con `AICursorPlugin`).

---

### 4.4 Búsqueda global / Command Palette (Cmd+K)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│              ┌── Cmd+K · LexAI ─────────────────────────────────┐          │
│              │                                                   │          │
│              │  > _                                              │          │
│              │  ─────────────────────────────────────────────── │          │
│              │                                                   │          │
│              │  ACCIONES RÁPIDAS                                 │          │
│              │  ┌───────────────────────────────────────────┐    │          │
│              │  │ /redactar/tutela      Redactar tutela     │    │          │
│              │  │ /redactar/demanda     Redactar demanda    │    │          │
│              │  │ /calcular/liquidacion Liquidación laboral │    │          │
│              │  │ /calcular/terminos    Términos procesales │    │          │
│              │  │ /revisar/contrato     Revisar contrato    │    │          │
│              │  │ /buscar/jurisprudencia Buscar sentencias  │    │          │
│              │  └───────────────────────────────────────────┘    │          │
│              │                                                   │          │
│              │  CASOS RECIENTES                                  │          │
│              │  ┌───────────────────────────────────────────┐    │          │
│              │  │ Pérez vs López Financiera · Civil · 3 días│    │          │
│              │  │ DDA vs Banco X · Tutela · activo          │    │          │
│              │  │ García Hermanos · Laboral · 8 días        │    │          │
│              │  └───────────────────────────────────────────┘    │          │
│              │                                                   │          │
│              │  CLIENTES / DOCUMENTOS / JURISPRUDENCIA           │          │
│              │  (busca al escribir 2+ caracteres)                │          │
│              │                                                   │          │
│              │  ─────────────────────────────────────────────── │          │
│              │  Esc para cerrar · ↑↓ para navegar · Enter para ir│          │
│              └───────────────────────────────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- El CommandPalette ya existe (`CommandPalette.tsx`). La propuesta es enriquecerlo con las skills como primera sección.
- Las skills se muestran con sintaxis de slash command: `/redactar/tutela` — visible, no oculto.
- Resultados agrupados por tipo: Acciones | Casos | Clientes | Documentos | Jurisprudencia.
- Ancho fijo 580px, centrado. Sin scroll horizontal.
- Navegación exclusivamente por teclado (↑↓ Enter Esc).

---

### 4.5 Skills Hub (acciones rápidas)

```
┌─ LexAI · Skills ────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌── Sidebar ──────────┐  ┌── Skills disponibles ─────────────────────────┐│
│  │                     │  │                                               ││
│  │  [←] Inicio         │  │  Redactar                                     ││
│  │                     │  │  ─────────                                    ││
│  │  ─────────────────  │  │  ┌──────────────┐  ┌──────────────┐           ││
│  │                     │  │  │ /tutela       │  │ /demanda     │           ││
│  │                     │  │  │ Tutela        │  │ Demanda civil│           ││
│  │                     │  │  │ art. 86 CP    │  │ CGP art. 82  │           ││
│  │                     │  │  │ [Usar →]      │  │ [Usar →]     │           ││
│  │                     │  │  └──────────────┘  └──────────────┘           ││
│  │                     │  │  ┌──────────────┐  ┌──────────────┐           ││
│  │                     │  │  │ /memorial     │  │ /poderEsp.   │           ││
│  │                     │  │  │ Memorial      │  │ Poder        │           ││
│  │                     │  │  │ procesal      │  │ especial     │           ││
│  │                     │  │  │ [Usar →]      │  │ [Usar →]     │           ││
│  │                     │  │  └──────────────┘  └──────────────┘           ││
│  │                     │  │                                               ││
│  │                     │  │  Calcular                                     ││
│  │                     │  │  ─────────                                    ││
│  │                     │  │  ┌──────────────┐  ┌──────────────┐           ││
│  │                     │  │  │ /liquidacion  │  │ /terminos    │           ││
│  │                     │  │  │ Liquidación   │  │ Términos     │           ││
│  │                     │  │  │ laboral CST   │  │ procesales   │           ││
│  │                     │  │  │ [Usar →]      │  │ [Usar →]     │           ││
│  │                     │  │  └──────────────┘  └──────────────┘           ││
│  │                     │  │                                               ││
│  │                     │  │  Revisar                                      ││
│  │                     │  │  ────────                                     ││
│  │                     │  │  ┌──────────────┐  ┌──────────────┐           ││
│  │                     │  │  │ /contrato     │  │ /clausulas   │           ││
│  │                     │  │  │ Revisar       │  │ Analizar     │           ││
│  │                     │  │  │ contrato      │  │ cláusulas    │           ││
│  │                     │  │  │ [Usar →]      │  │ [Usar →]     │           ││
│  │                     │  │  └──────────────┘  └──────────────┘           ││
│  └─────────────────────┘  └───────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- Las skills se organizan por verbo: Redactar | Calcular | Revisar | Buscar | Analizar.
- Cada skill card muestra: nombre, descripción en 1 línea, norma base de referencia.
- "Usar →" abre el Composer principal pre-completado con `/skill-path` y el contexto del caso activo.
- Las skills no disponibles por plan muestran el badge del plan requerido (integración con entitlements).

---

### 4.6 Voice Session activa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌── Sidebar ──────────┐  ┌── Área principal (atenuada) ──────────────────┐│
│  │  (sin cambios)      │  │  (contenido previo, atenuado al 40%)          ││
│  │                     │  │                                               ││
│  │                     │  │                                               ││
│  └─────────────────────┘  └───────────────────────────────────────────────┘│
│                                                                             │
│           ┌── Voice Session · LexAI ──────────────────────────┐            │
│           │                                                   │            │
│           │    ●●● (orb animado · escuchando)                 │            │
│           │                                                   │            │
│           │    Escuchando...                                  │            │
│           │                                                   │            │
│           │    ─────────────────────────────────────────────  │            │
│           │                                                   │            │
│           │    [Transcripción parcial del usuario]            │            │
│           │    "...necesito calcular la liquidación de..."    │            │
│           │                                                   │            │
│           │    ─────────────────────────────────────────────  │            │
│           │                                                   │            │
│           │    Último turno:                                  │            │
│           │    LexAI: "Entendido. Voy a calcular la          │            │
│           │    liquidación laboral de Juan García con         │            │
│           │    fecha de retiro 15 de marzo de 2026..."        │            │
│           │                                                   │            │
│           │    [Tool en progreso: calculate_liquidacion] ···  │            │
│           │                                                   │            │
│           │    ─────────────────────────────────────────────  │            │
│           │                                                   │            │
│           │    [II Pausar]    [Ver transcripción]   [X] Fin   │            │
│           │                                                   │            │
│           └───────────────────────────────────────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- El VoiceHUD actual (flotante abajo) se reemplaza por un modal centrado que aparece al activar voice.
- El fondo se atenúa para dar foco a la sesión (no un overlay completo — el abogado sigue viendo el contexto).
- El orb animado (ya implementado en `VoiceOrb.tsx`) es el centro visual.
- La transcripción parcial es visible en tiempo real.
- Se muestra el tool en progreso: el abogado sabe que LexAI está "haciendo algo", no solo hablando.
- Controles: Pausar (no cierra), Ver transcripción completa (drawer), Fin (cierra sesión).

---

### 4.7 Mobile (vista del caso)

```
┌─ iPhone · LexAI ──────────────────┐
│ [≡]  Pérez vs López  [Mic] [⋯]    │ ← TopBar compacto
│ ─────────────────────────────────  │
│                                   │
│  LexAI · hoy, 9:15am             │
│  ─────────────────────────────    │
│  Buenos días, doctor. Tiene       │
│  audiencia en 45 minutos.         │
│                                   │
│  [ARTIFACT: Resumen urgente]      │
│  ┌─────────────────────────────┐  │
│  │ Pérez vs López              │  │
│  │ Juzgado 3° Civil · 10:00am  │  │
│  │ Etapa: Alegatos             │  │
│  │ [Ver documentos] [Mapa →]   │  │
│  └─────────────────────────────┘  │
│                                   │
│  Le envié un resumen del caso     │
│  al correo con los puntos clave   │
│  para la audiencia.               │
│                                   │
│  ¿Necesita algo antes de ir?      │
│                                   │
│  ─────────────────────────────── │
│  usted · 9:18am                  │
│  Necesito la jurisprudencia del   │
│  Art. 141 del CST                 │
│  ─────────────────────────────── │
│  LexAI · 9:18am                  │
│  [ARTIFACT: Sentencias Art. 141]  │
│  ┌─────────────────────────────┐  │
│  │ 3 sentencias relevantes:    │  │
│  │ · SU-049/2017 · verificada  │  │
│  │ · T-476/2019 · verificada   │  │
│  │ · T-002/2020 · superada ⚠   │  │
│  └─────────────────────────────┘  │
│                                   │
│ ─────────────────────────────────  │
│ ┌── Composer ──────────────────┐  │
│ │ Escribe o di algo...  [Mic]  │  │
│ └──────────────────────────────┘  │
│                                   │
│ [Inicio] [Casos] [Canvas] [+]     │ ← BottomNav (4 items)
└───────────────────────────────────┘
```

**Notas de diseño:**
- El sidebar izquierdo desaparece en mobile. Reemplazado por hamburger `[≡]` que abre un drawer.
- El BottomNav en mobile tiene solo 4 items: Inicio | Casos | Canvas | + (nueva consulta).
- El composer está fijo al fondo, arriba del BottomNav.
- Los Artifacts son cards compactas con scroll horizontal si necesitan más contenido.
- El VoiceHUD se convierte en el botón `[Mic]` en el TopBar y en el Composer.

---

## SECCIÓN 5 — SISTEMA DE NAVEGACIÓN SIMPLIFICADO

### 5.1 Del sidebar de 23 items → 5 items + acceso universal

**Propuesta:**

```
SIDEBAR NUEVO (5 items principales + contextuales)

[L] LexAI · Rincones & Asoc.
─────────────────────────────

[+ Nueva consulta]           ← Acción primaria, siempre visible

─────────────────────────────

HOY (generado automáticamente)
· [thread del día]
· [thread de Pérez vs López - audiencia]

ESTA SEMANA
· [thread: Revisión tutela DDA]
· [thread: Cálculo García]

─────────────────────────────

Casos (23 activos)           ← lleva a /casos con la lista completa
                                O abre un thread: "lista mis casos urgentes"

─────────────────────────────

[⚙] Configuración
[?] Doctor Freddy Rincones
```

**Mapeo de los 23 items actuales → nueva ubicación:**

| Item actual (sidebar) | Nueva ubicación |
|---|---|
| Inicio | Home = pantalla de conversación diaria |
| Mi día | Primer thread del día (generado por LexAI) |
| Tareas | Pregunta: "¿cuáles son mis tareas?" → Artifact |
| Dashboard ejecutivo | Pregunta: "dame el resumen del despacho" → Artifact |
| Casos | Item de sidebar · lleva a /casos |
| Live Canvas | Item del thread del caso · "Abrir en Canvas" |
| Clientes | Cmd+K → "cliente [nombre]" o /casos?cliente=X |
| Calendario | Artifact "Agenda" en el thread del día |
| Documentos | Dentro del thread del caso · "Ver documentos" |
| Conocimiento | Cmd+K → /kb/search |
| Jueces | Dentro del thread del caso · "Ver perspectiva del juez" |
| Actividad | Sidebar: historial de threads (= actividad) |
| Menciones | Notificación en TopBar · badge |
| Notificaciones | Notificación en TopBar · badge |
| Buscar | Cmd+K (siempre disponible) |
| Reportes | Pregunta: "muéstrame los reportes del mes" |
| Facturación | Cmd+K → /facturacion |
| Fondos cliente | Cmd+K → /trust |
| Firmas | Botón en toolbar del Canvas |
| Marketplace | Cmd+K → /marketplace o settings |
| Leads | Cmd+K → /leads |
| Intake forms | Cmd+K → /intake-forms |
| Insights | Proactivo: LexAI los sugiere en el thread del día |
| Automatización | Settings → Automatización |

---

### 5.2 Los 16 tabs → Thread de conversación del caso

**Mapeo de tabs actuales → nuevo paradigma:**

| Tab actual | Nueva forma de acceder |
|---|---|
| Resumen | Artifact "Estado del caso" siempre visible (pinned) |
| Análisis IA | LexAI lo menciona proactivamente si hay extacciones |
| Cronología | "¿Cuál es la cronología del caso?" → Artifact timeline |
| Documentos | "¿Qué documentos tengo?" → Artifact lista + acciones |
| Partes | Visible en el Artifact "Estado del caso" (campo Partes) |
| Notas | "¿Qué notas tengo?" → Artifact lista + "Agrega una nota" |
| Calendario | Artifact "Agenda del caso" en el thread |
| Riesgos | "¿Cuáles son los riesgos?" → Artifact con semáforo |
| Citas | Panel IA en Canvas · también "¿qué citas tiene este caso?" |
| Refundamentación | "Refunda el caso" → Skill ejecutada en Canvas |
| Horas y Gastos | "¿Cuántas horas llevo en este caso?" → Artifact |
| Lecciones | "¿Qué aprendimos en casos similares?" → Artifact |
| Comentarios | Thread del caso = los comentarios |
| Tareas | "¿Qué tareas tengo en este caso?" → Artifact lista |
| Juez | "¿Cómo falla el juez X?" → Artifact predicción |
| Evidencia | "Verifica la evidencia" → Artifact con resultados |

---

## SECCIÓN 6 — SISTEMA DE COMPONENTES NUEVO

### 6.1 Componentes Shadcn a usar/extender

| Componente Shadcn | Extensión propuesta |
|---|---|
| `Dialog` | Modal de voice session (reemplaza VoiceHUD flotante) |
| `Sheet` | Drawer del sidebar en mobile (ya existe parcialmente) |
| `ScrollArea` | Thread de conversación (scroll virtual para threads largos) |
| `Tooltip` | Toasts contextuales en Artifacts (acciones hover) |
| `Separator` | Divisores entre mensajes del thread |
| `Badge` | Estado del caso (vigente/urgente/en riesgo) en la lista del sidebar |
| `Skeleton` | Loading state del thread y de los Artifacts |
| `Popover` | Menú de acciones de un Artifact (expandir, copiar, abrir en nueva vista) |

---

### 6.2 Componentes nuevos clave

**1. ConversationThread**
- Propósito: renderiza el thread de mensajes usuario/LexAI con soporte para Artifacts intercalados.
- Shadcn base: `ScrollArea` + primitivos propios.
- Props: `messages: ThreadMessage[]`, `onSend: (text: string) => void`, `context: MatterContext | null`.
- Estados: loading (3 Skeletons de burbuja), empty (placeholder: "Pregúntele algo a LexAI"), error (retry), normal.
- Evoluciona el `AssistantThread.tsx` existente.

**2. ArtifactCard**
- Propósito: card interactivo generado por LexAI y anclado al thread. Contiene datos estructurados (tabla de plazos, lista de documentos, predicción del juez, etc.) con acciones secundarias.
- Variantes por tipo: `agenda` | `case-status` | `documents` | `risks` | `judge` | `timeline` | `citations` | `calculation`.
- Props: `type: ArtifactType`, `data: unknown`, `actions: ArtifactAction[]`, `matterId: string`.
- Acciones propias: expandir a pantalla completa, copiar como texto, "Guardar en Canvas".
- Esta es la pieza más importante del nuevo paradigma.

**3. UnifiedComposer**
- Propósito: campo de entrada único que reemplaza `AssistantComposer` + `VoiceHUD` + los múltiples CTAs actuales.
- Props: `onSend`, `onVoice`, `context`, `placeholder`, `suggestions: string[]`.
- Funciones: texto libre, slash commands (`/redactar` → autocomplete), mention de casos (`@pérez`), adjuntar archivos, activar voz.
- Siempre visible, siempre centrado en el área principal.
- Sin estado flotante — es parte del layout estático.

**4. MatterContextBadge**
- Propósito: muestra el caso activo como contexto adjunto al Composer. Aparece cuando el thread está dentro de un caso.
- Ejemplo visual: `[Caso: Pérez vs López · Juzgado 3° Civil] [x]`
- Props: `matter: { id, titulo, tribunal }`, `onClear: () => void`.
- Clickeable → navega al caso.
- Integración con `AssistantContext` del store existente.

**5. SkillCommandChip**
- Propósito: pill/chip que representa una skill invocada en el composer. Se muestra cuando el usuario escribe `/redactar/tutela` — se convierte en un chip antes del mensaje.
- Ejemplo: `[/redactar/tutela ×]  Escribe el contexto de la tutela...`
- Props: `skill: string`, `onRemove: () => void`.
- Evolución del sistema de skills existente hacia una UX de "token" como Slack con apps.

**6. DayBriefingArtifact**
- Propósito: el primer Artifact del thread del día, generado automáticamente. Resume: audiencias, plazos, cambios normativos, tareas pendientes.
- No es un dashboard — es un artifact conversacional con acciones rápidas por item.
- Props: `date: Date`, `matters: MatterSummary[]`, `deadlines: Deadline[]`, `normChanges: NormChange[]`.
- Reemplaza la página de Inicio actual.

**7. VoiceSessionModal**
- Propósito: modal centrado que aparece cuando se activa la sesión de voz. Reemplaza el VoiceHUD flotante.
- Estados: idle | listening | thinking | acting | speaking | awaiting.
- Muestra: orb animado, transcripción parcial, último turno del agente, tool en progreso.
- Controles: Pausar | Ver transcripción | Fin.
- Evolución del `VoiceHUD.tsx` existente hacia un modal de Shadcn `Dialog`.

**8. CaseThreadSidebar**
- Propósito: sidebar izquierdo contextual cuando se está dentro de un caso. Muestra el historial de conversaciones de ese caso específico (no de toda la app).
- Items: lista de threads del caso por fecha, acciones directas (Ver documentos, Abrir en Canvas, Calcular términos).
- Reemplaza la navegación de tabs del caso.

**9. ArtifactAction**
- Propósito: botón de acción contextual dentro de un Artifact. Ejemplos: `[Redactar memorial]`, `[Ver en Canvas]`, `[Calcular prescripción]`.
- Props: `label: string`, `skill?: string`, `href?: string`, `onClick?: () => void`, `variant: 'primary' | 'secondary'`.
- Máximo 4 acciones por Artifact (anti-patrón: CTAs duplicados).

**10. GlobalSearchOverlay**
- Propósito: enriquecimiento del `CommandPalette.tsx` existente con skills como primera sección, resultados agrupados por tipo, y acciones rápidas con shortcuts visibles.
- El componente ya existe — esta es una extensión del mismo.

---

### 6.3 Tokens visuales — hacia el "feeling Claude/ChatGPT"

**Filosofia:** más espacio en blanco, menos bordes, tipografía más prominente.

**Cambios propuestos sobre el design system actual:**

| Token actual | Valor actual | Valor propuesto | Razón |
|---|---|---|---|
| `--pad-screen` | `28px` | `40px` desktop / `20px` mobile | Más whitespace como Claude |
| `--bg-rgb` | `#FAFAF7` | `#F9F9F6` (más neutro) | Reducir amarillamiento |
| Thread bubbles | No existe | `bg-bg-elev` usuario / `bg-bg` asistente | Diferenciación clara |
| Composer | No existe | `border-2 border-line rounded-2xl shadow-md focus:border-accent` | Prominencia del input |
| Artifact card | `.surface` actual | `.surface` + `border-l-4 border-accent/30` | Diferenciación visual de artifacts |
| Serif font | Source Serif Pro | Source Serif Pro (mantener) | Ya correcto para documentos |
| Sans UI | Inter | Inter (mantener) | Ya correcto |
| Typing indicator | No existe | 3 dots animados con spring | Feedback de que LexAI piensa |
| Sidebar width | `248px` | `220px` | Más espacio al contenido principal |

**Paleta para el Composer prominent:**
```css
/* Composer · estado normal */
border: 2px solid rgb(var(--line-rgb));
border-radius: 16px;
background: rgb(var(--bg-elev-rgb));
box-shadow: 0 2px 8px rgba(0,0,0,0.04);

/* Composer · estado focus */
border-color: rgb(var(--accent-rgb));
box-shadow: 0 0 0 3px rgb(var(--accent-soft-rgb));
```

---

### 6.4 Microinteracciones clave

**Typing del agente:**
- Los tokens aparecen con una sutil animación de fade-in en lugar de "pop" abrupto.
- El streaming actual ya existe en `AssistantThread.tsx`. Añadir `opacity: 0 → 1` con `transition-opacity duration-75` por token chunk.
- Una línea de puntos animados (`●●●`) antes del primer token.

**Tool calls (el agente está "haciendo algo"):**
- Aparece una barra de progreso indeterminada muy sutil (2px, color `accent`, debajo del Composer).
- El botón de envío se convierte en `[Detener]`.
- El `ThinkingStep.tsx` existente (collapse header) se mantiene pero se mueve al inicio del mensaje del asistente, no como elemento separado.

**Transición entre vistas:**
- Al hacer click en "Abrir caso" desde el thread del día → la pantalla hace slide-left (el thread se va a la izquierda, el thread del caso aparece desde la derecha). Usando Framer Motion `AnimatePresence`.
- Al abrir Canvas → fade-in del editor + fade-out del thread.
- Sin transiciones bruscas de página. El abogado siempre siente continuidad.

**Artifacts apareciendo:**
- Los Artifacts se revelan con `scaleY: 0.95 → 1` + `opacity: 0 → 1` en ~200ms. Sutil, no llamativo.
- El borde azul izquierdo (`border-l-4 border-accent/30`) se anima desde opacity 0.

---

## SECCIÓN 7 — FLUJOS DE INTERACCIÓN

### 7.1 "El abogado abre la app por primera vez en el día"

```
Usuario abre LexAI · 7:05am
         ↓
SSR genera el DayBriefingArtifact con datos reales:
  - fetchMatters() → plazos próximos 7 días
  - fetchDeadlines() → audiencias hoy
  - normChanges() → cambios normativos últimas 24h
         ↓
Pantalla muestra:
  Thread del día con mensaje proactivo de LexAI:
  "Buenos días, doctor Rincones. Tiene audiencia a las 9am
   (Pérez vs López) y un traslado que vence mañana (Banco X).
   [Artifact: Agenda de hoy]"
         ↓
El abogado lee el resumen. No tiene que navegar a ningún módulo.
         ↓
Si quiere actuar: escribe en el Composer o hace click en una acción del Artifact.
```

**Tiempo hasta primera información útil:** 0 segundos (SSR, no requiere interacción).
**Clicks requeridos:** 0 (la información está visible al abrir).
**Actual:** el abogado abre la app, ve el sidebar de 23 items, tiene que navegar a "Mi día" o "Casos".

---

### 7.2 "Quiere redactar una tutela contra el Banco X"

**Flujo nuevo (Conversation-First):**
```
Opción A: escribe en el Composer
  "Necesito redactar una tutela contra el Banco X
   por el caso de Diana Díaz"
         ↓
  LexAI interpreta: busca el caso DDA vs Banco X en matters
         ↓
  LexAI responde: "Encontré el caso DDA vs Banco X (Exp. 2024-0412).
   ¿Comenzamos con la tutela? Le voy a pedir algunos datos."
         ↓
  Dialog guiado en el Composer (slot por slot):
  "¿Cuál es el hecho vulnerador principal?"
  "¿Cuál es el derecho fundamental afectado?"
         ↓
  LexAI ejecuta /redactar/tutela con el contexto del caso
         ↓
  Artifact: "Tutela generada. [Ver en Canvas] [Descargar PDF]"
         ↓
  El abogado hace click en "Ver en Canvas" → abre TipTap con el borrador.

Opción B: usa Cmd+K
  Cmd+K → "/redactar/tutela" → Enter
         ↓
  Composer se pre-llena con el skill chip [/redactar/tutela]
         ↓
  Misma ruta desde el paso del dialog guiado.

Opción C: escribe "/" en el Composer
  "/" → aparece dropdown de autocomplete con las skills disponibles
  Selecciona "/redactar/tutela"
         ↓
  Misma ruta.
```

**Clicks desde pantalla inicial:** 0 (escribe directamente) o 2 (Cmd+K → Enter).
**Actual:** Sidebar → Canvas → toolbar → template selector → form → generar. 5+ clicks + fricción.

---

### 7.3 "Llega notificación de audiencia mañana del caso Pérez vs López"

```
LexAI detecta el evento (3 capas de sync: data_changed → Supabase Realtime)
         ↓
Toast no intrusivo en esquina superior derecha:
  "Nueva audiencia · Pérez vs López · mañana 9am
   [Ver detalles] [Preparar ahora]"
         ↓
Si hace click en "Preparar ahora":
  Abre el thread del caso Pérez vs López
  LexAI ya generó un Artifact proactivo:
  "LexAI preparó un resumen de preparación para la audiencia de mañana:
   [Artifact: Preparación audiencia]
   - 3 puntos clave del caso
   - Jurisprudencia relevante (5 sentencias verificadas)
   - Preguntas esperadas del juzgado
   [Redactar alegato de apertura]  [Ver documentos]"
         ↓
El abogado revisa, hace preguntas adicionales en el Composer.
```

**LexAI es proactivo:** no espera que el abogado navegue a "Calendario" para enterarse de la audiencia.
**Actual:** el abogado tiene que navegar a Notificaciones → ver la notificación → navegar al caso → abrir el tab Calendario → recordar qué documentos tiene.

---

### 7.4 "Necesita ver el riesgo de prescripción de todos sus casos"

```
El abogado escribe en el Composer (desde cualquier pantalla):
  "¿Cuáles de mis casos tienen riesgo de prescripción?"
         ↓
LexAI ejecuta:
  → list_matters() (todos los casos activos)
  → calculate_prescripcion(matter_id) para cada uno
  → filtra los que tienen plazo < 90 días
         ↓
Artifact: tabla con resultados:
  "4 casos con riesgo de prescripción:
   [ARTIFACT: Tabla de prescripción]
   ┌────────────────────────────────────────────┐
   │ Caso             │ Tipo  │ Plazo restante  │
   │ Pérez vs López   │ CST   │ 3 días  [!]    │
   │ García vs SENA   │ Civil │ 45 días [!]    │
   │ DDA vs Banco X   │ CST   │ 62 días        │
   │ Torres vs IPS    │ Civil │ 89 días        │
   └────────────────────────────────────────────┘
   ¿Desea que calcule los intereses de alguno
   o que redacte el radicado preventivo?"
```

**1 query vs múltiples vistas:** el abogado no necesita ir a cada caso a revisar el tab "Riesgos". Una pregunta, respuesta estructurada con los 4 casos.
**Actual:** navegar a cada caso → tab Riesgos → revisar. Para 23 casos activos: imposible sin automatización.

---

### 7.5 "Quiere revisar el documento que LexAI redactó ayer"

```
El abogado escribe:
  "Abre el borrador de tutela que redactaste ayer para DDA"
         ↓
LexAI busca: matter_documents donde kind='borrador' AND created_at > hoy-24h
  Y matter.cliente ILIKE '%DDA%' O matter.titulo ILIKE '%Banco X%'
         ↓
LexAI responde: "Encontré el borrador 'Tutela DDA vs Banco X v3'
  generado ayer a las 4:32pm. [Abrir en Canvas]"
         ↓
Click en "Abrir en Canvas" → TipTap carga el documento.

Alternativa: Cmd+K → busca "tutela DDA" → aparece en resultados Documentos.
```

**Natural language recovery:** el abogado no necesita recordar rutas o dónde guardó el documento. Solo describe lo que busca.
**Actual:** navegar a /documentos → filtrar por fecha → encontrar el documento → abrirlo.

---

## SECCIÓN 8 — MIGRATION PATH

### Fase 0 (ahora, 0 código): Preparación conceptual
- Definir la especificación de `ArtifactCard` (tipos y estructura de datos).
- Documentar el mapeo de cada tab del caso → nuevo Artifact o thread.
- Identificar los 5 primeros Artifacts a implementar (agenda del día, estado del caso, documentos, riesgos, juez).
- **Riesgo:** ninguno — solo documentación.

---

### Fase 1 (2 semanas): Simplificación del sidebar — feature flag `LEXAI_NAV_V2`

**Qué cambia:**
- El sidebar se simplifica de 23 → 5 items (los demás siguen en sus URLs pero no están en el sidebar).
- El historial de threads del día reemplaza los items de "Mi día", "Actividad", "Menciones".
- El Composer del `AssistantSidebar` se convierte en `UnifiedComposer` y se mueve al área principal.
- El `VoiceHUD` flotante se integra en el `UnifiedComposer` (botón [Mic]).

**Qué se preserva legado:**
- Todas las rutas `/mi-dia`, `/actividad`, `/menciones`, `/insights`, etc. siguen existiendo y siendo accesibles vía Cmd+K.
- Los 16 tabs del caso siguen iguales (no se tocan en esta fase).
- El `AssistantSidebar` en modo overlay sigue funcionando.

**Riesgo:** Bajo. El sidebar simplificado puede coexistir con la navegación existente.

---

### Fase 2 (3 semanas): Home = Conversación — feature flag `LEXAI_HOME_CONVERSATION`

**Qué cambia:**
- La página `/inicio` se reemplaza por el nuevo `ConversationThread` con el `DayBriefingArtifact`.
- El thread del día se genera en SSR con datos reales del despacho.
- Los "Artifacts" del tipo `agenda` y `case-status` se implementan primero.
- El `DayBriefingArtifact` reemplaza el widget de "Tu mes en LexAI" y el grid de "Calculadoras".

**Qué se preserva legado:**
- `/mi-dia` sigue funcionando como fallback si el usuario desactiva el feature flag.
- El `Greeting` component de inicio sigue como fallback.

**Riesgo:** Medio. El SSR del thread del día requiere que los fetchers existentes (`fetchMatters`, `getCachedShellData`) devuelvan datos en tiempo bajo (ya tienen TTL 60s).

---

### Fase 3 (4 semanas): Caso = Thread — feature flag `LEXAI_MATTER_CONVERSATION`

**Qué cambia:**
- El detalle del caso `/casos/[matterId]` migra de "16 tabs" a "thread de conversación del caso".
- Los `MATTER_TABS` se convierten en Artifacts invocables: el primer mensaje del thread siempre muestra el `ArtifactCard` de tipo `case-status` con los datos principales.
- Los threads del caso se persisten en Supabase: cada conversación en el caso queda guardada y accesible desde el `CaseThreadSidebar`.
- Los Artifacts `timeline`, `documents`, `risks`, `judge` se implementan.

**Qué se preserva legado:**
- Los 16 tabs originales se mantienen como ruta `/casos/[id]/legacy?tab=X` durante 2 sprints adicionales.
- El sistema de TanStack Query invalidation (3 capas) se adapta para actualizar Artifacts automáticamente.

**Riesgo:** Alto. Este es el cambio más grande. Requiere persistencia de threads por caso en Supabase (nueva tabla `matter_threads`). La migración de datos del estado de los tabs al estado del thread requiere trabajo.

---

### Fase 4 (3 semanas): Canvas unificado y Voice Session Modal

**Qué cambia:**
- El `VoiceHUD` flotante se reemplaza por el `VoiceSessionModal` (Dialog de Shadcn).
- El panel de citas del Canvas se unifica con el Composer contextual (`UnifiedComposer` en modo canvas).
- El Canvas se accede desde el thread del caso (botón "Abrir en Canvas") y desde el `CaseThreadSidebar` (acceso directo).
- Se elimina "Live Canvas" como item de sidebar — el canvas es una vista del caso, no un módulo separado.

**Qué se preserva legado:**
- La ruta `/canvas` sigue funcionando como canvas global (sin caso adjunto) para documentos nuevos.

**Riesgo:** Bajo-Medio. El Canvas TipTap ya funciona. La integración del VoiceHUD como modal es una refactorización de presentación, no de lógica.

---

### Fase 5 (2 semanas): Polish, mobile y métricas

**Qué cambia:**
- Implementación completa del BottomNav de 4 items para mobile.
- Microinteracciones (typing indicators, artifact reveal animations, slide transitions).
- Eliminación definitiva de los 16 tabs legacy.
- Implementación del `SkillCommandChip` en el Composer.
- Implementación del sistema de sugerencias proactivas en el thread (notificaciones → mensajes del agente).

**Riesgo:** Bajo.

---

### Feature flags propuestos

```typescript
// Variables de entorno para activar fases progresivamente
NEXT_PUBLIC_LEXAI_NAV_V2=false           // Fase 1: sidebar simplificado
NEXT_PUBLIC_LEXAI_HOME_CONVERSATION=false // Fase 2: home = conversación
NEXT_PUBLIC_LEXAI_MATTER_CONVERSATION=false // Fase 3: caso = thread
NEXT_PUBLIC_LEXAI_VOICE_MODAL=false       // Fase 4: voice session modal
```

Los flags siguen el mismo patrón que `NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED` ya existente.

---

## SECCIÓN 9 — MÉTRICAS DE ÉXITO

### 9.1 Métricas propuestas y baseline estimado

| Métrica | Definición | Baseline estimado (hoy) | Target (post-rediseño) |
|---|---|---|---|
| **Time to First Value (TTFV)** | Segundos desde que el abogado abre la app hasta que recibe información útil de LexAI | ~30s (navegar → módulo → cargar) | <3s (thread del día visible en SSR) |
| **Composer First Touch Rate** | % de sesiones donde el abogado usa el Composer antes que el sidebar | ~15% (mayoría usa sidebar) | >60% |
| **Sidebar Depth** | Promedio de clicks en el sidebar por sesión | ~8 clicks/sesión | <2 clicks/sesión |
| **Task Completion Rate** | % de tareas completadas sin abandonar el flujo | ~40% (estimado, muchos vuelven a Claude) | >75% |
| **Feature Discovery** | % de usuarios que usan >3 skills diferentes en el primer mes | <10% (las skills están ocultas) | >35% |
| **Session Return Rate (7d)** | % de usuarios que vuelven en los próximos 7 días | Dato pendiente de analytics | Mejorar +20pp |

### 9.2 Cómo medir

- **TTFV:** First Contentful Paint del thread del día (Vercel Analytics ya disponible).
- **Composer First Touch:** evento `composer_focus` antes de `sidebar_click` en la sesión. Posthog o similar.
- **Sidebar Depth:** evento `sidebar_item_click` con contador por sesión.
- **Task Completion Rate:** definir "tasks" como skill executions con resultado no-error. Ya se puede medir vía `pushActivity` del AssistantStore.
- **Feature Discovery:** contar `skill_executed` por usuario con DISTINCT skill en los primeros 30 días.

### 9.3 Experimento recomendado antes de la migración completa

Lanzar Fase 1 (sidebar simplificado) a un 20% de usuarios (feature flag por `firm_id`). Medir TTFV y Composer First Touch en 2 semanas. Si TTFV baja a <5s y Composer First Touch sube >30%, proceder con Fase 2.

---

## SECCIÓN 10 — ACCESIBILIDAD (WCAG AA)

### 10.1 Checklist mínimo

**Contraste (4.5:1 texto normal, 3:1 elementos UI)**
- [ ] Texto `ink-3` (`#6B6862`) sobre `bg` (`#FAFAF7`): ratio actual ~4.2:1 — AJUSTAR a `#5A5752` para cumplir AA.
- [ ] Chips de estado (`chip-green`, `chip-amber`, `chip-red`) sobre `bg-elev`: verificar con herramienta (sospecha de ratio bajo en `chip-amber` con `warn-rgb`).
- [ ] Artifacts cards: el borde `border-accent/30` no es elemento de texto — OK.
- [ ] Botones `btn-primary` (`#0066CC` fondo, blanco texto): ratio ~5.9:1 — OK.

**Keyboard Navigation**
- [ ] `ConversationThread`: las burbujas de mensajes son `role="listitem"`, el thread es `role="log" aria-live="polite"` para anunciar nuevos mensajes.
- [ ] `ArtifactCard`: `role="region" aria-label="Resumen del caso"` (u otro según tipo). Las acciones internas son `<button>` tabulables.
- [ ] `UnifiedComposer`: `<textarea>` con `aria-label="Mensaje para LexAI"`. Submit con `Ctrl+Enter` / `Cmd+Enter` documentado.
- [ ] `VoiceSessionModal`: foco se mueve al modal al abrir (`autoFocus` en el botón Fin). `aria-modal="true"`. Esc cierra.
- [ ] `CommandPalette`: ya usa `cmdk` que tiene ARIA correcto. Verificar que el listbox tenga `aria-label`.
- [ ] Skip link: `<a href="#main-content" class="sr-only focus:not-sr-only">` — agregar si no existe.

**ARIA y semántica**
- [ ] Thread de conversación: `<main role="main">`, mensajes en `<article>` con `aria-label="Mensaje de LexAI, 9:15am"`.
- [ ] Artifacts: `aria-live="off"` (no los anuncien cada vez que se generen — el mensaje del agente ya los introduce verbalmente).
- [ ] Form errors en el Composer: `aria-invalid="true"` + `aria-describedby="error-id"` cuando el Composer esté bloqueado.
- [ ] Iconos sin texto: `aria-label` en todos los `btn-icon`. Ya existe en el código — verificar exhaustivamente.

**Focus Management**
- [ ] Al abrir el thread de un caso desde el thread del día: foco al `<main>` del caso con `focus()`.
- [ ] Al cerrar `VoiceSessionModal`: foco vuelve al botón que lo abrió (`returnFocus`).
- [ ] Al generar un nuevo Artifact: NO mover el foco automáticamente. El agente lo anuncia vía `aria-live="polite"`.

**Motion Reduce**
- [ ] Todos los componentes con animación deben respetar `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .artifact-reveal, .thread-slide, .typing-indicator {
      animation: none;
      transition: none;
    }
  }
  ```
- El `shimmer` de skeleton ya tiene animación — agregar la media query al `globals.css`.
- Framer Motion: usar `useReducedMotion()` hook en todos los componentes animados.

**Lectores de pantalla (bonus)**
- El typing indicator (puntos animados) debe tener `aria-label="LexAI está escribiendo"` y `aria-live="polite"` para anunciar cuando aparece.
- Los Artifacts generados deben tener un `<span class="sr-only">Resultado de LexAI: [tipo del artifact]</span>` al inicio.

---

## APÉNDICE — MAPPING COMPLETO DE COMPONENTES EXISTENTES

| Componente actual | Destino en el nuevo paradigma |
|---|---|
| `Sidebar.tsx` | Refactor: 5 items + historial de threads |
| `AppShell.tsx` | Mantener estructura, ajustar grid a `[220px_1fr]` |
| `AssistantSidebar.tsx` | Deprecar: su lógica migra a `ConversationThread` (área principal) |
| `AssistantThread.tsx` | Evoluciona a `ConversationThread` (nuevo componente) |
| `AssistantComposer.tsx` | Evoluciona a `UnifiedComposer` |
| `AssistantRail.tsx` | Deprecar: el rail ya no es necesario con Composer en área principal |
| `VoiceHUD.tsx` | Refactor a `VoiceSessionModal` (Dialog) + botón en UnifiedComposer |
| `VoiceOrb.tsx` | Mantener: se usa dentro de `VoiceSessionModal` |
| `MatterTabs.tsx` | Deprecar: reemplazado por `ConversationThread` del caso |
| `CommandPalette.tsx` | Extender: añadir sección de skills al inicio |
| `ThinkingStep.tsx` | Mantener: se integra en `ConversationThread` |
| `CanvasEditor.tsx` | Mantener: el canvas TipTap no cambia |
| `inicio/page.tsx` | Reemplazar con ConversationThread + DayBriefingArtifact |
| `casos/[matterId]/page.tsx` | Refactor: renderiza ConversationThread del caso |
| `MatterPredictionCard.tsx` | Se convierte en ArtifactCard de tipo `judge` |
| `RiesgosTab.tsx` | Se convierte en ArtifactCard de tipo `risks` |
| `CitasTab.tsx` | Se mantiene en el panel IA del Canvas |
| `ActivityTimeline.tsx` | Se integra como sección colapsable del CaseThreadSidebar |
| `ContextBadge.tsx` | Evoluciona a `MatterContextBadge` |

---

*Documento generado por el UX/UI Designer Agent de LexAI · 2026-05-20*  
*Revisión requerida por Freddy Rincones antes de proceder a implementación*

---

# ═══ PROPUESTA v2 — PARITY VISUAL CLAUDE/CHATGPT + DELTAS LEXAI ═══

**Fecha:** 2026-05-20  
**Revisión:** v2 — expansión visual, tokens completos, composer detallado, plan de ejecución refinado  
**Nota:** Esta sección NO repite el contenido de v1. Solo incorpora lo que v2 añade, refina o decide con más precisión. Léase en conjunto con las Secciones 1-10 anteriores.

---

## v2.1 — RESUMEN EJECUTIVO DEL DELTA

### Qué añade v2 sobre v1

| Aspecto | v1 propuso | v2 refina | Razón del cambio |
|---|---|---|---|
| Design tokens | Ajustes puntuales sobre el sistema actual (`--pad-screen`, `bg-rgb`) | Sistema completo: tipografía exacta, paleta dual light/dark, scale de espaciado, radios, sombras y easing | v1 dejaba la implementación abierta a interpretación; v2 cierra todas las variables antes de tocar código |
| Composer | `UnifiedComposer` genérico con Mic y adjuntar | Réplica funcional del composer de Claude (menú "+", selector de modelo, waveform de voz, send circular brand navy) con 11 opciones LexAI específicas | El nivel de detalle de v1 no era suficiente para que un desarrollador lo construyera sin volver a pedir especificaciones |
| Sidebar | 5 items simplificados + historial de threads | Sidebar colapsable con secciones "Mis hilos" y "Plantillas y Skills", toggle de collapse, footer de usuario con menú idéntico al de Claude, wireframe en ambos estados (expandido y colapsado) | v1 no definía el estado colapsado ni el footer — gaps que bloquean la implementación |
| Home/Day Briefing | Artifact `DayBriefingArtifact` con datos del despacho | Wireframe ASCII completo del thread inicial con mensaje del agente en prosa formal, chips de sugerencias, sin cards ni métricas de métricas de uso | v1 describía el componente pero no el contenido visible; el abogado necesita ver exactamente qué va a leer al abrir la app |
| Micro-interacciones | Listadas conceptualmente (fade-in tokens, artifact reveal) | Especificadas con duraciones exactas, easing, comportamiento por evento, y distinción `prefers-reduced-motion` | v1 no podía implementarse sin estas decisiones numéricas |
| Diferenciación competitiva | Mencionada como ventaja general | 10 deltas LexAI numerados y explicados frente a Claude/ChatGPT — cada uno ejecutable y medible | El usuario necesita argumentos concretos para posicionar LexAI ante un cliente que ya paga Claude Pro |
| Plan de implementación | 5 fases con feature flags | 6 fases renombradas con flags `NEXT_PUBLIC_UX_V2_*`, directorio `/components/v2/*` para cero riesgo sobre componentes actuales, y nueva Fase 0 de tokens (sin tocar layouts) | v1 asumía que tokens y layouts podían cambiar en paralelo — demasiado riesgo operacional |
| Stack de animación | Framer Motion mencionado | Confirmado disponible (framer-motion 11.13.1 en package.json) con API exacta a usar por componente | Eliminación de incertidumbre de dependencias |

### Las 5 decisiones que necesitan aprobación antes de avanzar

1. **Tipografía Serif:** usar Tiempos Headline (licencia comercial ~$300/año) o sustituir con New Spirit (Google Fonts, gratuita). Impacta directamente el look premium del canvas y los títulos. Recomendación: Tiempos para producción, New Spirit durante desarrollo.

2. **Dark mode:** implementar en Fase 6 (7 semanas de ejecución) o en paralelo desde Fase 0 como variable CSS (costo marginal mínimo si se define desde el inicio). Recomendación: definir las variables CSS dark en Fase 0 aunque la UI dark se active en Fase 6.

3. **Selector de modelo visible en el composer:** exponer al abogado la elección entre modelos (gpt-4o, gpt-4-turbo, gpt-realtime) como lo hace Claude, o mantenerlo fijo en el backend y no exponerlo. Recomendación: exponer solo cuando hay consecuencia de costo o capacidad (ej. modo voz vs modo texto).

4. **Directorio de componentes:** los nuevos componentes van en `/components/v2/*` (propuesta v2) o se refactorizan en el lugar de los existentes con un flag de variante. Recomendación: `/components/v2/*` durante desarrollo, merge al directorio principal cuando la Fase correspondiente se declare estable.

5. **Font loading:** Tiempos Headline o New Spirit requieren configuración de `next/font`. Si ya existe `@font-face` para Source Serif Pro en el CSS global, hay riesgo de conflicto de FOUT. Aprobar la estrategia de font antes de Fase 0.

---

## v2.2 — DESIGN TOKENS COMPLETOS

### Tipografía

**Familias:**

| Rol | Familia | Fallback | Método de carga |
|---|---|---|---|
| Serif — títulos y canvas | Tiempos Headline (comercial) o New Spirit (Google Fonts) | Georgia, serif | `next/font/google` (New Spirit) o self-hosted (Tiempos) |
| Sans — UI, body, conversación | Inter | -apple-system, system-ui, sans-serif | `next/font/google` — ya configurado en el proyecto |
| Mono — fragmentos de código, IDs, referencias normativas | JetBrains Mono | Consolas, monospace | `next/font/google` |

**Scale tipográfico:**

| Token | Tamaño | Peso | Line-height | Uso |
|---|---|---|---|---|
| `text-display` | 2rem (32px) | 600 | 1.2 | Títulos de página (Home, /casos) |
| `text-heading-1` | 1.5rem (24px) | 600 | 1.3 | Títulos de sección, nombres de caso |
| `text-heading-2` | 1.125rem (18px) | 600 | 1.4 | Subtítulos, encabezados de artifact |
| `text-body-lg` | 1rem (16px) | 400 | 1.6 | Mensajes del agente en el thread |
| `text-body` | 0.875rem (14px) | 400 | 1.5 | UI general, labels, listas |
| `text-small` | 0.75rem (12px) | 400 | 1.4 | Timestamps, badges de estado, metadata |
| `text-micro` | 0.6875rem (11px) | 500 | 1.3 | Caps de sección del sidebar ("MIS HILOS") |
| `text-canvas` | 1rem (16px) Inter / 1.0625rem (17px) Tiempos | 400 / 400 | 1.7 | Cuerpo del editor TipTap — mayor legibilidad en documentos largos |
| `text-mono` | 0.8125rem (13px) | 400 | 1.5 | Exp. judiciales, IDs, referencias de norma |

**Regla de uso serif:** aplicar Tiempos/New Spirit exclusivamente en: títulos `H1` del canvas, nombre del despacho en el sidebar, y encabezados de artifacts de tipo `document`. Todo lo demás usa Inter.

---

### Paleta de color

**Modo claro (light) — base:**

| Token CSS | Valor hex | Uso |
|---|---|---|
| `--color-bg` | `#F9F8F5` | Fondo de pantalla principal |
| `--color-bg-elevated` | `#FFFFFF` | Cards, composer, modals, artifacts |
| `--color-bg-subtle` | `#F2F1EC` | Sidebar, hover de items de lista |
| `--color-border` | `#E5E3DC` | Bordes de cards, separadores |
| `--color-border-strong` | `#C8C5BB` | Borde del composer en focus |
| `--color-ink` | `#1A1917` | Texto principal, mensajes del thread |
| `--color-ink-2` | `#4A4844` | Texto secundario, labels, subtítulos |
| `--color-ink-3` | `#78756F` | Timestamps, placeholders, metadata |
| `--color-ink-4` | `#A8A49D` | Texto deshabilitado |

**Brand y acentos:**

| Token CSS | Valor hex | Uso |
|---|---|---|
| `--color-brand` | `#0E2A5E` | Navy LexAI — botón send, links primarios, badges de caso activo |
| `--color-brand-hover` | `#0A2050` | Hover sobre elementos brand |
| `--color-brand-soft` | `#E8EDF7` | Fondo de chips de caso adjunto, highlight de skill activa |
| `--color-accent` | `#B8763C` | Cobre — acentos secundarios, borde del composer en focus (alternativa calida al azul) |
| `--color-accent-soft` | `#F5EBE0` | Fondo de chips de skill, fondo de sugerencias |

**Semánticos:**

| Token CSS | Valor hex | Uso semántico |
|---|---|---|
| `--color-success` | `#2D6A4F` | Verde botánico — citas verificadas, normas vigentes |
| `--color-success-soft` | `#E8F5EF` | Fondo de badge verificada |
| `--color-warning` | `#C05621` | Granate cálido — plazos urgentes (<3 días), riesgo alto |
| `--color-warning-soft` | `#FEF0E7` | Fondo de badge urgente |
| `--color-caution` | `#92400E` | Ámbar oscuro — citas moduladas/sospechosas |
| `--color-caution-soft` | `#FEF3C7` | Fondo de badge modulada |
| `--color-destructive` | `#B91C1C` | Rojo — eliminar, error crítico, norma derogada/inexequible |
| `--color-destructive-soft` | `#FEE2E2` | Fondo de badge derogada |
| `--color-info` | `#1E40AF` | Azul info — notificaciones neutrales, Diario Oficial |
| `--color-info-soft` | `#EFF6FF` | Fondo de badge info |

**Modo oscuro (dark) — espejo deliberado:**

El dark mode no es simplemente invertir colores. La estrategia es:

| Token light | Token dark | Lógica |
|---|---|---|
| `--color-bg` `#F9F8F5` | `#111110` | Casi negro con tinte cálido — no puro `#000000` |
| `--color-bg-elevated` `#FFFFFF` | `#1C1B1A` | Card ligeramente más claro que el fondo |
| `--color-bg-subtle` `#F2F1EC` | `#242320` | Sidebar oscuro con tinte cálido |
| `--color-ink` `#1A1917` | `#F0EDE8` | Texto principal warm-white |
| `--color-brand` `#0E2A5E` | `#4A7FD4` | Navy se aclara en dark para mantener contraste AA |
| `--color-success` `#2D6A4F` | `#4ADE80` | Verde más saturado para visibilidad en dark |
| `--color-warning` `#C05621` | `#FB923C` | Naranja más claro |
| `--color-destructive` `#B91C1C` | `#F87171` | Rojo más claro |

---

### Espaciado

Base: **4px**. Escala:

| Token | Valor | Uso |
|---|---|---|
| `space-1` | 4px | Gaps internos mínimos (iconos + label) |
| `space-2` | 8px | Padding de badges, chips |
| `space-3` | 12px | Padding de botones compactos |
| `space-4` | 16px | Padding de items de sidebar, separación entre elementos en cards |
| `space-5` | 20px | Padding horizontal del composer |
| `space-6` | 24px | Padding vertical de secciones dentro de un artifact |
| `space-8` | 32px | Padding entre secciones del thread |
| `space-10` | 40px | Padding lateral del área principal (desktop) — el `--pad-screen` de v1 elevado |
| `space-12` | 48px | Separación entre grupos de mensajes en el thread |
| `space-16` | 64px | Espacio bajo el último mensaje antes del composer |

El compositor (UnifiedComposer) tiene padding interno `space-5` horizontal / `space-4` vertical.

---

### Radios de borde

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | Badges, chips pequeños |
| `radius-md` | 10px | Botones, inputs, items de menú |
| `radius-lg` | 14px | Cards de artifact, modals internos |
| `radius-xl` | 18px | Composer, VoiceSessionModal, Command Palette |
| `radius-full` | 9999px | Botón send circular, avatar de usuario, orb de voz |

Motivación del cambio desde v1 (que usaba `rounded-md` = 6px por defecto): los radios más generosos (14-18px) son el indicador visual más inmediato de modernidad. Claude usa 16px en su composer; ChatGPT usa 24px. LexAI con 18px en el composer se posiciona en ese rango sin perder seriedad profesional.

---

### Sombras

Tres niveles estrictamente calidos (evitar sombras azuladas):

| Token | Valor CSS | Uso |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(26, 25, 23, 0.04)` | Hover sobre items de lista, badges |
| `shadow-sm` | `0 2px 6px rgba(26, 25, 23, 0.06), 0 1px 2px rgba(26, 25, 23, 0.04)` | Cards de artifact, sidebar colapsado |
| `shadow-md` | `0 4px 16px rgba(26, 25, 23, 0.10), 0 2px 4px rgba(26, 25, 23, 0.06)` | Composer en focus, modals, Command Palette |
| `shadow-lg` | `0 8px 32px rgba(26, 25, 23, 0.14), 0 4px 8px rgba(26, 25, 23, 0.08)` | VoiceSessionModal, drawers |

En dark mode los valores `rgba` cambian a `rgba(0, 0, 0, 0.3/0.5/0.6/0.7)` respectivamente.

---

### Animaciones

| Token | Duración | Easing | Uso |
|---|---|---|---|
| `motion-instant` | 0ms | — | Cambios de estado sin animación (prefers-reduced-motion) |
| `motion-fast` | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Hover, active states, tooltips |
| `motion-normal` | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Aparición de chips, badges, menús desplegables |
| `motion-slow` | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Artifact reveal, slide de VoiceModal, apertura del Canvas |
| `motion-spring` | 600ms | Framer Motion `spring { stiffness: 400, damping: 30 }` | Orb de voz, waveform de voz |

La función `cubic-bezier(0.16, 1, 0.3, 1)` es el "ease-out expo" que usa Claude para sus transiciones de panel. Genera una sensación de respuesta inmediata (arranca rápido) con un aterrizaje suave.

---

## v2.3 — COMPOSER LEXAI v2

El Composer es la pieza más crítica de la UI. En Claude y ChatGPT es el 90% de la experiencia. LexAI v2 lo replica y lo supera con contexto jurídico.

### Wireframe ASCII — Estado normal

```
┌─ Composer LexAI v2 ─────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  [Caso: Pérez vs López · Juzgado 3° Civil  ×]                       │   │
│  │  ← chip de contexto adjunto (aparece cuando hay caso activo)        │   │
│  │                                                                      │   │
│  │  Pregúntele algo a LexAI, use /skill o @ para mencionar...         │   │
│  │                                                                      │   │
│  │                                                                      │   │
│  │  ──────────────────────────────────────────────────────────────────  │   │
│  │  [+]                                    [gpt-4o ▼]  [Mic]  [  →  ] │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│       ↑                                         ↑             ↑             │
│    Menú "+"                              Selector modelo   Send circular    │
│    (11 opciones)                         dropdown          brand navy       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe ASCII — Menú "+" expandido

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─ Menú + ──────────────────────────────────────────────┐                  │
│  │                                                       │                  │
│  │  ADJUNTAR CONTEXTO DEL DESPACHO                       │                  │
│  │  ┌───────────────────────────────────────────────┐    │                  │
│  │  │  [⬜] Subir documento      PDF, Word, hasta 50MB│   │                  │
│  │  │  [⬜] Adjuntar caso        Autocompletado firma │   │                  │
│  │  │  [⬜] Adjuntar parte       Cliente o contraparte│   │                  │
│  │  │  [⬜] Adjuntar juez        Para simular vista   │   │                  │
│  │  │  [⬜] Adjuntar plazo       Selector de fecha    │   │                  │
│  │  └───────────────────────────────────────────────┘    │                  │
│  │                                                       │                  │
│  │  SKILLS Y HERRAMIENTAS                                │                  │
│  │  ┌───────────────────────────────────────────────┐    │                  │
│  │  │  [⬜] Skills               /redactar, /calcular│   │                  │
│  │  │  [⬜] Buscar jurisprudencia Toggle activar      │   │                  │
│  │  │  [⬜] Conectores           DIAN · Rama · IGAC  │   │                  │
│  │  │  [⬜] Usar plantilla       Tutela · Contrato · │   │                  │
│  │  │                           Derecho de petición  │   │                  │
│  │  └───────────────────────────────────────────────┘    │                  │
│  │                                                       │                  │
│  │  VOZ                                                  │                  │
│  │  ┌───────────────────────────────────────────────┐    │                  │
│  │  │  [⬜] Modo dictado         Voz OpenAI Realtime │   │                  │
│  │  └───────────────────────────────────────────────┘    │                  │
│  │                                                       │                  │
│  └───────────────────────────────────────────────────────┘                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Detalle de cada opción del menú "+":**

| Opción | Delta LexAI | Comportamiento al seleccionar |
|---|---|---|
| Subir documento | Igual que Claude | File picker → adjunta al mensaje como contexto del RAG |
| Adjuntar caso | Delta LexAI | Abre popover con buscador de matters de la firma; el caso seleccionado aparece como chip en el composer |
| Adjuntar parte | Delta LexAI | Buscador de partes (clientes, contrapartes) de los matters activos; popula el contexto del agente |
| Adjuntar juez | Delta LexAI | Buscador de jueces en la BD de LexAI; activa automáticamente el sub-agente `judge_simulator` |
| Adjuntar plazo | Delta LexAI | DatePicker inline; el plazo se incluye como contexto para cálculos de términos |
| Skills | Igual que ChatGPT GPTs | Abre sub-menú con las skills disponibles: `/ask`, `/lex`, `/redactar/*`, `/revisar/*`, `/calcular/*` |
| Buscar jurisprudencia | Delta LexAI | Toggle ON/OFF; cuando ON, cada respuesta del agente incluye búsqueda en el RAG de sentencias |
| Conectores | Delta LexAI | Sub-menú: DIAN (RUT, obligaciones), Rama Judicial (estado expediente), IGAC (certificados), SICAAC (conciliación) |
| Usar plantilla | Delta LexAI | Sub-menú: Tutela art. 86 CP · Contrato laboral CST · Derecho de petición art. 23 CP · Poder especial |
| Modo dictado | Extiende Claude | Activa OpenAI Realtime API con las 117 tools del agente (reemplaza el flujo de voz actual) |

### Selector de modelo

```
┌─ gpt-4o ▼ ──────────────────────────────────┐
│                                              │
│  MODELOS DE TEXTO                            │
│  ● gpt-4o          Recomendado · rápido     │
│    gpt-4-turbo     Análisis complejos        │
│                                              │
│  VOZ                                         │
│    gpt-4o-realtime  Sesión de voz (117 tools)│
│                                              │
│  BÚSQUEDA SEMÁNTICA                          │
│    text-embedding-3-large  Solo indexación   │
│                                              │
│  ─────────────────────────────────────────   │
│  Modelo activo afecta el costo por consulta. │
│  Plan actual: Demo Firm · sin límite         │
│                                              │
└──────────────────────────────────────────────┘
```

### Voz — Réplica exacta de Claude con extensiones LexAI

Cuando el abogado hace click en `[Mic]` en el composer (o en "Modo dictado" del menú "+"):

```
┌─ Composer · Modo voz activo ──────────────────────────────────────────────┐
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  [Chip de caso si aplica]                                         │   │
│  │                                                                    │   │
│  │  ████ ██ ████████ ██ ████ ██████ ██ ████                          │   │
│  │  ← waveform animado (bars de amplitud en tiempo real)             │   │
│  │                                                                    │   │
│  │  Escuchando...  0:07                                               │   │
│  │                                                                    │   │
│  │  ──────────────────────────────────────────────────────────────    │   │
│  │  [  ×  Cancelar  ]                          [  ✓  Confirmar  ]    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

- El waveform usa la Web Audio API (ya integrada en `VoiceOrb.tsx`) para visualizar amplitud en tiempo real.
- El timer cuenta en formato `M:SS` desde el inicio de la grabación.
- Cancelar descarta el audio y vuelve al estado normal del composer.
- Confirmar envía el audio al endpoint de transcripción y lo inserta como mensaje de texto en el thread (modo dictado texto) o lo envía directamente al agente Realtime (modo voz full).
- El botón send `[→]` cambia a `[●]` durante la grabación para indicar "en curso".

### Botón send

- Forma: circular, 36px de diámetro.
- Color: `--color-brand` (`#0E2A5E`) navy.
- Icono: flecha up (`ArrowUp` de lucide-react), blanco, 16px.
- Estado deshabilitado (campo vacío): `opacity: 0.4`, sin cursor pointer.
- Estado activo: `opacity: 1`, hover con `--color-brand-hover`.
- Animación al click: ripple circular de 200ms con `motion-fast` easing.

---

## v2.4 — SIDEBAR v2 + COMMAND PALETTE

### Sidebar — Wireframe expandido (220px)

```
┌─ Sidebar expandido ──────────────────────────┐
│                                              │
│  ┌── Logo ───────────────────────────────┐   │
│  │  [L]  LexAI          [ ← colapsar ]  │   │
│  │       Demo Firm                      │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  [+ Nueva consulta]                          │
│                                              │
│  ────────────────────────────────────────    │
│                                              │
│  MIS HILOS                                   │
│  · Hoy                                       │
│    · Briefing del día · 7:02am               │
│    · Pérez vs López — audiencia              │
│  · Ayer                                      │
│    · Tutela DDA vs Banco X                   │
│    · Cálculo liquidación García              │
│  · Esta semana                               │
│    · Revisión contrato TeleCo               │
│    · Búsqueda jurisprudencia CST 141         │
│  [Ver todos los hilos]                       │
│                                              │
│  ────────────────────────────────────────    │
│                                              │
│  ACCESOS                                     │
│  · Casos          (23 activos)               │
│  · Documentos                                │
│  · Calendario                                │
│                                              │
│  ────────────────────────────────────────    │
│                                              │
│  PLANTILLAS Y SKILLS                         │
│  · /redactar/tutela                          │
│  · /redactar/demanda                         │
│  · /calcular/liquidacion                     │
│  · /revisar/contrato                         │
│  [Ver todas las skills →]                    │
│                                              │
│  ────────────────────────────────────────    │
│                                              │
│  ┌── Footer usuario ──────────────────────┐  │
│  │  [FR]  Freddy Rincones        [ ··· ] │  │
│  │        Demo Firm · Admin              │  │
│  └───────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Sidebar — Wireframe colapsado (56px)

```
┌── Colapsado ──┐
│               │
│  [L]  [ → ]  │  ← Logo + botón expandir
│               │
│  ────────     │
│               │
│  [ + ]        │  ← Nueva consulta (solo icono + tooltip)
│               │
│  ────────     │
│               │
│  [ ◉ ]        │  ← Mis hilos (icono MessageSquare)
│  [ □ ]        │  ← Casos
│  [ 📄 ]       │  ← Documentos
│  [ 📅 ]       │  ← Calendario
│               │
│  ────────     │
│               │
│  [ ⚡ ]        │  ← Skills (icono Zap)
│               │
│  ────────     │
│               │
│  [FR]         │  ← Avatar usuario
│               │
└───────────────┘
```

**Comportamiento del sidebar:**

- Ancho expandido: 220px. Colapsado: 56px.
- Transición: `motion-slow` (400ms, `cubic-bezier(0.16, 1, 0.3, 1)`).
- En colapsado, cada item muestra un Tooltip con el nombre completo al hover.
- El estado (expandido/colapsado) se persiste en `localStorage` bajo la clave `lexai_sidebar_state`.
- En viewport `< 1024px`, el sidebar no colapsa a 56px — pasa directamente a Drawer (Sheet de Shadcn).

**Sección "Mis hilos"** (equivalente a "Chats" en Claude):

- Agrupados por fecha: Hoy / Ayer / Esta semana / Mes pasado.
- Cada hilo muestra el título del primer mensaje del usuario truncado a 28 caracteres.
- Hover: aparece un menú `···` con opciones: Renombrar, Archivar, Eliminar.
- El hilo activo tiene fondo `--color-bg-subtle` y borde izquierdo de 2px `--color-brand`.

**Sección "Plantillas y Skills"** (equivalente a GPTs en ChatGPT):

- Muestra las 4 skills más usadas por el abogado logueado (personalización por `user_id`).
- Link "Ver todas →" navega a `/skills` (hub completo de v1 sección 4.5).
- Cada skill tiene el icono de verbo: Redactar (PenLine), Calcular (Calculator), Revisar (Search), Buscar (BookOpen).

**Footer de usuario — Menú (idéntico al de Claude en estructura):**

Click en `[···]` abre un DropdownMenu de Shadcn:

```
┌─ Menú usuario ─────────────────────────────────┐
│  freddy.rincones@tdxcore.com                   │
│  ─────────────────────────────────────────────  │
│  Configuración                      Ctrl+,      │
│  Perfil de firma                                │
│  Plan y facturación                             │
│  ─────────────────────────────────────────────  │
│  Idioma                             Español     │
│  Obtener ayuda                                  │
│  ─────────────────────────────────────────────  │
│  Mejorar plan                       Pro →       │
│  Invitar a un colega                            │
│  ─────────────────────────────────────────────  │
│  Cerrar sesión                                  │
└────────────────────────────────────────────────┘
```

---

### Command Palette — Cmd+K v2

Wireframe del estado con búsqueda activa:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    ┌─ LexAI · Cmd+K ─────────────────────────────────────────────┐     │
│    │                                                             │     │
│    │  [🔍]  tut...                                      [Esc]   │     │
│    │  ─────────────────────────────────────────────────────────  │     │
│    │                                                             │     │
│    │  SKILLS RELEVANTES                                          │     │
│    │  ▶ /redactar/tutela     Tutela art. 86 CP        ⏎         │     │
│    │    /redactar/tutela-colectiva  Tutela colectiva             │     │
│    │                                                             │     │
│    │  CASOS                                                      │     │
│    │    Tutela DDA vs Banco X       Exp. 2024-0412  · activo     │     │
│    │    Pérez vs López (tutela)     Exp. 2024-0398  · activo     │     │
│    │                                                             │     │
│    │  DOCUMENTOS                                                 │     │
│    │    Tutela DDA v3.docx          hace 1 día                   │     │
│    │    Modelo tutela laboral.pdf   Plantillas                   │     │
│    │                                                             │     │
│    │  JURISPRUDENCIA                                             │     │
│    │    T-760/2008 · Derecho a la salud (tutela)                 │     │
│    │    SU-049/2017 · Tutela y mínimo vital                      │     │
│    │                                                             │     │
│    │  ─────────────────────────────────────────────────────────  │     │
│    │  ↑↓ navegar  ·  ⏎ abrir  ·  Tab completar  ·  Esc cerrar  │     │
│    └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Grupos de búsqueda:**

| Grupo | Fuente de datos | Shortcut de acceso directo |
|---|---|---|
| Skills | Lista local de skills registradas | Escribir `/` para filtrar solo skills |
| Casos | `list_matters` — nombre, cliente, expediente | Escribir `#` para filtrar solo casos |
| Clientes | `list_clients` — nombre, NIT | Escribir `@` para filtrar clientes |
| Partes | `list_parties` del matter activo | Disponible con `@` también |
| Jueces | Base interna de jueces | Escribir `!` para filtrar jueces |
| Documentos | `search_documents` con embeddings | Escribir `>` para filtrar documentos |
| Plazos | `list_deadlines` próximos 30 días | Activos con `⚠` prefix |
| Jurisprudencia | RAG vector store de sentencias | Solo con 3+ caracteres |
| Normativa | RAG vector store de normas | Solo con 3+ caracteres |
| Acciones de UI | Ir a Configuración, Nuevo caso, etc. | Siempre visible en estado vacío |

**Las 117 voice tools accesibles como comandos de texto:** cualquier tool disponible para el agente de voz es también invocable desde el Cmd+K escribiendo su nombre o descripción en lenguaje natural. Ejemplo: escribir "calcular prestaciones García" → aparece como acción "Calcular prestaciones sociales · García Hermanos" que al pulsar Enter abre el thread con la skill pre-cargada.

---

## v2.5 — HOME v2 · DAY BRIEFING THREAD PROACTIVO

La página de inicio al abrir LexAI es un thread de conversación. No hay dashboard, no hay tarjetas de métricas, no hay calculadoras. El agente habla primero.

```
┌─ LexAI · Inicio · miércoles 20 de mayo de 2026 ────────────────────────────┐
│                                                                             │
│  ┌── Sidebar (expandido) ──┐  ┌── Thread del día ──────────────────────────┐│
│  │  [L] LexAI  [ ← ]      │  │                                            ││
│  │  ─────────────────────  │  │                                            ││
│  │  [+ Nueva consulta]     │  │                                            ││
│  │                         │  │  LexAI · hoy, 7:02am                       ││
│  │  MIS HILOS              │  │  ─────────────────────────────────────────  ││
│  │  · Briefing del día ●   │  │                                            ││
│  │  · Pérez — audiencia    │  │  Buenos días, Lic. Rincones. Hoy tiene     ││
│  │  · Tutela DDA v3        │  │  1 audiencia programada: Aguilar vs         ││
│  │                         │  │  Avianca S.A., Tribunal Superior de        ││
│  │  ACCESOS                │  │  Bogotá, sala 12, a las 9:00am.            ││
│  │  · Casos  (23)          │  │                                            ││
│  │  · Documentos           │  │  Además, el Diario Oficial de ayer         ││
│  │  · Calendario           │  │  publicó la Reforma Laboral 2026.          ││
│  │                         │  │  Identifiqué 3 de sus contratos vigentes   ││
│  │  SKILLS                 │  │  que requieren ajuste antes del 1 de       ││
│  │  · /redactar/tutela     │  │  agosto. ¿Por dónde empezamos?             ││
│  │  · /calcular/liquid.    │  │                                            ││
│  │  · /revisar/contrato    │  │  [ARTIFACT: Agenda del día]                ││
│  │                         │  │  ┌──────────────────────────────────────┐  ││
│  │  ─────────────────────  │  │  │  HOY · miércoles 20 de mayo          │  ││
│  │                         │  │  │  ────────────────────────────────     │  ││
│  │  [FR] Freddy R.  [···]  │  │  │  ● 9:00am · Audiencia · Aguilar vs  │  ││
│  └─────────────────────────┘  │  │    Avianca · Tribunal Superior B12   │  ││
│                                │  │    [Abrir caso]  [Ver documentos]   │  ││
│                                │  │                                      │  ││
│                                │  │  ● 3:00pm · Vence traslado DDA       │  ││
│                                │  │    vs Banco X · Exp. 2024-0412       │  ││
│                                │  │    [Abrir caso]  [Redactar resp.]    │  ││
│                                │  │                                      │  ││
│                                │  │  PROXIMA SEMANA                      │  ││
│                                │  │  → Juicio García Hermanos · jue 22   │  ││
│                                │  └──────────────────────────────────────┘  ││
│                                │                                            ││
│                                │  ┌─ Sugerencias rápidas ────────────────┐  ││
│                                │  │  [Prepararme para la audiencia]       │  ││
│                                │  │  [Ver los 3 contratos afectados]      │  ││
│                                │  │  [Revisar traslado DDA]               │  ││
│                                │  │  [Ver mis casos urgentes]             │  ││
│                                │  └──────────────────────────────────────┘  ││
│                                │                                            ││
│                                │  ─────────────────────────────────────────  ││
│                                │                                            ││
│                                │  ┌── Composer ─────────────────────────┐   ││
│                                │  │                                     │   ││
│                                │  │  Pregúntele algo a LexAI...        │   ││
│                                │  │                                     │   ││
│                                │  │  [+]           [gpt-4o ▼][Mic][ →] │   ││
│                                │  └─────────────────────────────────────┘   ││
│                                └────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño del Home v2:**

- El mensaje de LexAI usa prosa formal colombiana: "Lic. Rincones", "usted", lenguaje jurídico preciso.
- El mensaje nunca es genérico: siempre referencia hechos concretos del despacho (audiencia específica, norma específica, número de contratos específico).
- Los chips de sugerencia son máximo 4. Son frases completas en primera persona del abogado ("Prepararme para la audiencia"), no labels de acción ("Preparar audiencia"). Esto replica el patrón de Claude.
- Cuando el abogado hace click en un chip de sugerencia, ese texto se inserta en el Composer y se envía inmediatamente (no requiere confirmar).
- Si no hay audiencias ni plazos urgentes, el mensaje de LexAI cambia de tono pero siempre es proactivo: "Hoy no tiene audiencias programadas. Tiene 23 casos activos; el más próximo en vencer es García Hermanos (8 días). ¿Desea revisar algo en particular?"
- El Artifact "Agenda del día" es siempre el primer artifact del thread. Está fijado (pinned) y no desaparece al hacer scroll — permanece visible con sticky comportamiento mientras el thread crece.
- No hay dashboard, no hay grid de calculadoras, no hay stats de uso. Todo eso es accesible vía Composer o Cmd+K.

---

## v2.6 — MICRO-INTERACCIONES · EL FACTOR "WOW"

Estas son las 8 micro-interacciones que elevan LexAI de "app funcional" a "producto memorable". Cada una tiene duración, easing y comportamiento especificado.

### 1. Aparición de un Artifact (slide-up + fade)

Cuando el agente termina de generar un artifact y lo inserta en el thread:

- Estado inicial: `opacity: 0`, `translateY: 12px`, `scaleY: 0.97`.
- Estado final: `opacity: 1`, `translateY: 0`, `scaleY: 1`.
- Duración: 400ms con `cubic-bezier(0.16, 1, 0.3, 1)`.
- El borde izquierdo del artifact (2px, `--color-brand`) aparece con un segundo delay de 100ms con `opacity: 0 → 1` en 250ms.
- Framer Motion: `motion.div` con `initial` / `animate` props.
- `prefers-reduced-motion`: sin animación, el artifact aparece instantáneamente.

### 2. Thinking indicator del agente (tres puntos pulsantes)

Mientras el agente procesa (antes del primer token de respuesta):

- Tres círculos de 6px, color `--color-ink-3`.
- Animación: escala 1.0 → 1.4 → 1.0 de forma secuencial con 200ms de delay entre cada círculo.
- Loop infinito hasta que llega el primer token.
- Al llegar el primer token: el indicator se desvanece con `opacity: 1 → 0` en 150ms, y la burbuja de respuesta aparece en su lugar.
- Implementado con CSS `@keyframes` + Tailwind `animate-bounce` variant personalizado. No requiere Framer Motion — mantener simple.
- ARIA: `role="status" aria-label="LexAI está procesando su solicitud"`.

### 3. Tool call ejecutándose (chip + loader + check)

Cuando el agente ejecuta una tool (ej. `calculate_liquidacion`, `search_jurisprudencia`):

- Aparece un chip inline en la burbuja del agente:
  ```
  [⟳  Calculando liquidación...  ]
  ```
- El chip tiene fondo `--color-accent-soft`, borde `--color-accent`, texto `--color-ink-2`.
- El icono `⟳` rota continuamente con `animate-spin`.
- Cuando la tool termina: el icono cambia a `✓` (CheckCircle de lucide-react), el color del chip cambia a `--color-success-soft` / `--color-success`, y el texto cambia a "Liquidación calculada".
- Transición del cambio: 250ms `motion-normal`.
- El chip permanece visible 2 segundos y luego se colapsa suavemente (`maxHeight: auto → 0`, `opacity: 1 → 0`, 400ms).

### 4. Streaming de texto con cursor parpadeante

El texto del agente aparece token a token (streaming ya implementado):

- Al final del último token visible: cursor `|` de 2px × 14px, color `--color-ink-2`.
- El cursor parpadea: `opacity: 1 → 0 → 1` cada 530ms (idéntico al cursor de Claude).
- Cuando el streaming termina: el cursor se desvanece con `opacity: 1 → 0` en 400ms.
- El texto de cada chunk aparece con `opacity: 0 → 1` en 75ms — acumulativo, no de golpe.
- Implementado en el componente existente `AssistantThread.tsx` — extensión mínima.

### 5. Toggle dark mode con cross-fade

Al activar/desactivar el dark mode desde el menú de usuario:

- Los colores de fondo cambian con `transition: background-color 250ms, color 250ms` aplicado a `:root`.
- No hay "flash" blanco/negro — la transición es suave entre los dos estados de la paleta.
- El icono en el footer de usuario cambia de `Sun` a `Moon` (lucide-react) con un rotate de 180° en 400ms.
- `prefers-color-scheme: dark` del sistema se detecta y aplica automáticamente al primer uso — el abogado puede sobrescribir en configuración.

### 6. Hover sobre items del sidebar

- Transición de fondo: `--color-bg` → `--color-bg-subtle` en 150ms `motion-fast`.
- El icono del item se desplaza `translateX: 0 → 2px` en 150ms — sutil "nudge" hacia la derecha.
- El texto no cambia de color (mantiene `--color-ink-2`).
- Item activo: fondo permanente `--color-bg-subtle`, borde izquierdo 2px `--color-brand`, texto `--color-ink`.
- El desplazamiento `translateX` en hover no aplica al item activo.

### 7. Click en send — ripple sutil

Al hacer click en el botón send circular:

- Ripple: un círculo blanco semitransparente (`rgba(255,255,255,0.3)`) crece desde el centro del botón, `scale: 0 → 2`, `opacity: 0.3 → 0`, en 400ms.
- El botón hace `scale: 1 → 0.93 → 1` en 150ms — feedback táctil visual.
- Implementado con Framer Motion `whileTap={{ scale: 0.93 }}` + CSS pseudo-element para el ripple.

### 8. Notificación entrante — slide-in desde arriba

Cuando llega una notificación (nueva audiencia, cambio normativo, mención):

- El toast de Sonner aparece desde `translateY: -100% → 0` con `opacity: 0 → 1` en 300ms `cubic-bezier(0.16, 1, 0.3, 1)` — desde arriba, igual que Claude.
- El toast usa el color semántico correcto: `--color-warning-soft` con borde `--color-warning` para urgencias, `--color-info-soft` para informativos.
- Auto-dismiss a los 6 segundos para informativos, sin auto-dismiss para urgentes (el abogado debe cerrar manualmente).
- El botón de acción principal del toast (`[Preparar ahora]`, `[Ver detalles]`) usa color `--color-brand`.
- Sonner (ya instalado) maneja el sistema base — estas son las configuraciones de `toastOptions` en el `<Toaster>`.

---

## v2.7 — 10 DELTAS LEXAI vs CLAUDE Y CHATGPT

Lo que hace que LexAI sea un producto superior para el despacho jurídico colombiano, y no simplemente una réplica:

**1. Adjuntar entidades del despacho en el composer**

Claude y ChatGPT permiten adjuntar archivos genéricos. LexAI permite adjuntar directamente un caso, una parte procesal, un juez o un plazo desde la base de datos viva del despacho. El contexto no es un documento — son relaciones reales de la firma. Cuando el abogado adjunta el caso "Pérez vs López", el agente ya sabe su expediente, juez, etapa, documentos y plazos sin que el abogado escriba nada más.

**2. Verificador de citas legales en tiempo real**

Ningún competidor genérico (Claude, ChatGPT) verifica si una sentencia que el agente cita sigue vigente en el ordenamiento colombiano. LexAI lo hace en cada respuesta: cada cita se marca con el badge `verificada / superada / sospechosa / no_encontrada` en tiempo real contra el RAG de sentencias. El abogado no firma un escrito con una cita derogada.

**3. Detector de derogación automático**

Cuando el agente cita una norma, LexAI consulta el grafo de vigencia (normas + modificaciones + derogaciones explícitas e implícitas) y advierte si la norma fue derogada, modificada por una reforma posterior, o declarada inexequible. Claude puede alucinar una norma vigente que lleva 3 años derogada. LexAI no.

**4. Voice agent OpenAI Realtime con 117 tools nativas**

Claude tiene dictado de voz básico (transcripción). ChatGPT tiene "Advanced Voice Mode" sin acceso a datos del usuario. LexAI tiene un agente de voz que, mientras el abogado habla, ejecuta herramientas reales: calcula liquidaciones, abre casos, busca jurisprudencia, agenda audiencias. Las 117 tools del backend son accesibles en tiempo real sin salir de la conversación de voz.

**5. Skills personalizables por firma con plantillas legales**

Los "GPTs" de ChatGPT son públicos o requieren configuración técnica. En LexAI, cada firma puede crear sus propias skills con plantillas preconfiguradas para sus documentos más frecuentes (tutela de habitualidad, contrato a término fijo para el sector específico, poder especial con cláusulas particulares). Las skills viven por `firm_id` y respetan el contexto jurídico colombiano.

**6. Multi-tenancy con RLS estricto**

Claude y ChatGPT no tienen concepto de "firma de abogados": todos los chats de todos los usuarios están en el mismo plano. LexAI separa estrictamente los datos por firma (`firm_id`) con Row Level Security en Supabase: el abogado de la Firma A nunca puede ver los casos de la Firma B, incluso si comparten el mismo servidor. Esto es un requisito no negociable para datos de clientes bajo el deber de confidencialidad (Art. 77 del Código Disciplinario del Abogado).

**7. Day Briefing proactivo basado en agenda real**

Claude y ChatGPT esperan que el usuario pregunte. LexAI habla primero — cada mañana, el agente genera un briefing personalizado con la agenda real del despacho: audiencias del día, plazos críticos, cambios normativos que afectan casos activos, y documentos pendientes de firma. El abogado abre la app y ya sabe qué tiene que hacer. Ningún asistente genérico puede hacer esto sin acceso a los datos del despacho.

**8. Conectores legales colombianos**

LexAI se conecta a fuentes de datos oficiales del sistema jurídico colombiano: DIAN (validación de RUT, estado de obligaciones tributarias), Rama Judicial (estado de procesos judiciales por expediente), IGAC (certificados de libertad y tradición), SICAAC (directorio de centros de conciliación autorizados). Claude no tiene acceso a ninguna de estas fuentes. ChatGPT tampoco. Son datos que el abogado hoy busca manualmente en 4 portales diferentes.

**9. Canvas TipTap especializado en formato legal**

LexAI tiene un editor de documentos construido específicamente para escritos jurídicos colombianos: tipografía Source Serif Pro para la lectura de documentos largos, detección automática de citas (con verificación inline), exportación a Word y PDF con formato de memorial judicial, soporte para colaboración en tiempo real entre miembros del despacho, y firma digital integrada. Claude tiene un "artifacts" para documentos genéricos. ChatGPT tiene "Canvas" genérico. Ninguno verifica citas ni exporta con formato judicial.

**10. Sub-agentes especializados**

LexAI tiene sub-agentes con conocimiento jurídico profundo: `judge_simulator` (predice el fallo probable de un juez específico basado en su historial estadístico), `predict_outcome` (estima la probabilidad de éxito de una pretensión con base en jurisprudencia similar), `labor_calculator` (calcula liquidaciones con todas las variables del CST colombiano). Claude y ChatGPT son agentes generalistas. LexAI tiene agentes que fueron entrenados para la especificidad del derecho colombiano.

---

## v2.8 — PLAN DE IMPLEMENTACIÓN v2

Este plan complementa las 5 fases de v1 con una estructura de 6 fases, flags renombrados bajo el prefijo `NEXT_PUBLIC_UX_V2_*`, y el principio de cero riesgo: todos los componentes nuevos viven en `/components/v2/*` hasta que cada fase se declare estable, momento en el que se hace el merge al directorio principal.

**Principio de cero riesgo:** los componentes actuales (`AssistantSidebar`, `VoiceHUD`, `MatterTabs`, etc.) no se tocan hasta que el reemplazo en `/components/v2/` esté completamente funcional y probado. Los feature flags controlan cuál versión renderiza. El rollback es un cambio de variable de entorno.

---

### Fase 0 — Design Tokens v2 (3 días)

**Flag:** ninguno — los tokens se aplican globalmente desde el primer día.

**Qué cambia:**

- `tailwind.config.ts`: agregar todos los tokens de paleta de v2.2 como colores custom con nombres `brand`, `brand-hover`, `brand-soft`, `accent`, `accent-soft`, `success`, `success-soft`, `warning`, `warning-soft`, `caution`, `caution-soft`, `destructive`, `destructive-soft`, `info`, `info-soft`.
- `globals.css`: agregar variables CSS para todos los tokens de color (light y dark), más la escala de sombras y las declaraciones `@keyframes` para las micro-interacciones de v2.6.
- `tailwind.config.ts`: agregar `borderRadius` con los 5 radios de v2.2, y `transitionTimingFunction` con los easings definidos.
- `next/font`: configurar la carga de New Spirit (o Tiempos) para el rol Serif y JetBrains Mono para el rol Mono.
- `globals.css`: declaración de `prefers-reduced-motion` para todas las animaciones.

**Qué NO cambia:** ningún layout, ningún componente, ninguna ruta.

**Riesgo:** mínimo. Los nuevos tokens son aditivos — no sobreescriben los tokens actuales hasta que los componentes v2 los usen explícitamente.

**Entregable:** PR con `tailwind.config.ts` + `globals.css` actualizados y un componente `TokenPreview` en `/components/v2/TokenPreview.tsx` que muestra la paleta completa para revisión visual.

---

### Fase 1 — Sidebar v2 + Cmd+K enriquecido (1 semana)

**Flag:** `NEXT_PUBLIC_UX_V2_SHELL=true`

**Qué cambia:**

- Nuevo componente `/components/v2/Sidebar.tsx` con las secciones "Mis hilos", "Accesos", "Plantillas y Skills", toggle de colapso, y footer de usuario con menú completo.
- Nuevo componente `/components/v2/SidebarUserMenu.tsx` (DropdownMenu de Shadcn con las opciones del menú de usuario de v2.4).
- Enriquecimiento del `CommandPalette.tsx` existente: añadir grupo "Skills relevantes" como primera sección, shortcut prefixes (`/`, `#`, `@`, `!`, `>`), y búsqueda en jurisprudencia/normativa.
- El `AppShell.tsx` detecta el flag y renderiza `/components/v2/Sidebar.tsx` en lugar del `Sidebar.tsx` actual.

**Qué NO cambia:** todos los contenidos de las páginas. Solo la cáscara de navegación.

**Riesgo:** bajo. El sidebar es un componente de presentación sin lógica de datos compleja.

---

### Fase 2 — Home · Day Briefing Thread (1 semana)

**Flag:** `NEXT_PUBLIC_UX_V2_HOME=true`

**Qué cambia:**

- Nueva página `/app/(app)/inicio/page.tsx` que renderiza un `ConversationThread` (del componente existente `AssistantThread.tsx` extendido) con el `DayBriefingArtifact` como primer mensaje generado en SSR.
- Nuevo componente `/components/v2/DayBriefingArtifact.tsx` con el wireframe de v2.5.
- Nuevo componente `/components/v2/SuggestionChips.tsx` para los 4 chips de acción rápida.
- El SSR llama a los fetchers existentes (`getCachedShellData`, `fetchMatters`) para poblar el briefing con datos reales.

**Qué NO cambia:** la página antigua `/inicio` sigue siendo el fallback cuando el flag está desactivado.

**Riesgo:** medio. La dependencia de SSR en los fetchers de datos reales requiere que los endpoints del backend estén disponibles en build time. Mitigación: datos de fallback (skeleton) si los fetchers fallan.

---

### Fase 3 — Composer v2 estilo Claude (1 semana)

**Flag:** `NEXT_PUBLIC_UX_V2_COMPOSER=true`

**Qué cambia:**

- Nuevo componente `/components/v2/UnifiedComposer.tsx` con: menú "+" de 11 opciones (v2.3), selector de modelo (DropdownMenu), botón Mic con waveform, botón send circular brand navy.
- Nuevo componente `/components/v2/ComposerPlusMenu.tsx` (menú "+" completo con las secciones de v2.3).
- Nuevo componente `/components/v2/ModelSelector.tsx` (DropdownMenu con los modelos de v2.3).
- Nuevo componente `/components/v2/VoiceWaveform.tsx` (waveform animado con Web Audio API — replica visual del modo dictado de Claude).
- El `UnifiedComposer` reemplaza el `AssistantComposer` actual cuando el flag está activo.
- Las micro-interacciones de v2.6 (send ripple, waveform, thinking indicator) se implementan en esta fase.

**Qué NO cambia:** la lógica de envío de mensajes al backend. El nuevo composer usa los mismos hooks (`useAssistantStore`, `useChat`) que el actual.

**Riesgo:** bajo-medio. El componente es nuevo y aislado. La integración con el backend existente es por los mismos hooks.

---

### Fase 4 — MatterArtifact · Reemplazo de los 16 tabs (2 semanas)

**Flag:** `NEXT_PUBLIC_UX_V2_MATTER=true`

**Qué cambia:**

- Refactor de `/app/(app)/casos/[matterId]/page.tsx`: cuando el flag está activo, renderiza `ConversationThread` del caso en lugar de `MatterTabs`.
- El primer mensaje del thread es siempre el `CaseStatusArtifact` (estado del caso, partes, plazos, documentos clave) generado automáticamente.
- Nuevos artifacts: `CaseStatusArtifact`, `DocumentsArtifact`, `RisksArtifact`, `JudgeArtifact`, `TimelineArtifact` — todos en `/components/v2/artifacts/`.
- Nuevo componente `/components/v2/CaseThreadSidebar.tsx` (historial de hilos del caso + accesos directos).
- Persistencia de threads por caso en Supabase: nueva tabla `matter_threads` (id, matter_id, user_id, messages JSONB, created_at).

**Qué NO cambia:** la ruta `/casos/[matterId]?legacy=true` mantiene los 16 tabs durante 2 sprints adicionales como rollback.

**Riesgo:** alto. Requiere nueva tabla en Supabase con migración, y la generación automática del `CaseStatusArtifact` depende de que todos los fetchers del caso estén disponibles. Mitigación: datos de skeleton + generación asíncrona (no SSR) del artifact inicial.

---

### Fase 5 — Canvas integrado al thread (1 semana)

**Flag:** `NEXT_PUBLIC_UX_V2_CANVAS=true`

**Qué cambia:**

- El botón "Abrir en Canvas" en los artifacts de documento abre el `CanvasEditor` TipTap como un panel derecho deslizable (Sheet de Shadcn) en lugar de navegar a `/canvas`.
- El panel de citas del Canvas y el chat contextual se unifican en el `UnifiedComposer` del Canvas.
- El `VoiceHUD` flotante se reemplaza por el botón Mic en el `UnifiedComposer`.
- Los `CitationBadge` existentes se integran con el panel de IA del Canvas.
- Transición de apertura del Canvas: slide-from-right con Framer Motion `AnimatePresence`, duración 400ms.

**Qué NO cambia:** la ruta `/canvas` como editor independiente sigue funcionando para documentos nuevos sin caso adjunto.

**Riesgo:** bajo-medio. El CanvasEditor ya funciona. La integración como Sheet es un cambio de envoltorio, no de lógica del editor.

---

### Fase 6 — Dark mode + a11y AAA (1 semana)

**Flag:** `NEXT_PUBLIC_UX_V2_DARK_MODE=true`

**Qué cambia:**

- Activación del toggle de dark mode en el menú de usuario (el token CSS dark ya estará definido desde Fase 0).
- Revisión de contraste: todos los colores semánticos del dark mode se verifican con contraste mínimo AA (4.5:1 texto, 3:1 UI).
- Auditoría de ARIA: `role`, `aria-label`, `aria-live`, `aria-describedby` en todos los componentes v2.
- Skip link: `<a href="#main-content">` en el `AppShell`.
- Focus visible: `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2` aplicado de forma consistente a todos los elementos interactivos.
- Prueba con lector de pantalla (NVDA/VoiceOver) del flujo crítico: abrir app → leer briefing → enviar mensaje → recibir artifact.

**Riesgo:** bajo. Es una fase de pulido y validación, no de nuevos componentes.

---

### Resumen de fases y timeline

| Fase | Descripción | Duración | Flag | Riesgo |
|---|---|---|---|---|
| 0 | Design tokens v2 | 3 días | Sin flag | Mínimo |
| 1 | Sidebar v2 + Cmd+K | 1 semana | `UX_V2_SHELL` | Bajo |
| 2 | Home Day Briefing | 1 semana | `UX_V2_HOME` | Medio |
| 3 | Composer v2 | 1 semana | `UX_V2_COMPOSER` | Bajo-medio |
| 4 | MatterArtifact (reemplazo 16 tabs) | 2 semanas | `UX_V2_MATTER` | Alto |
| 5 | Canvas integrado al thread | 1 semana | `UX_V2_CANVAS` | Bajo-medio |
| 6 | Dark mode + a11y AAA | 1 semana | `UX_V2_DARK_MODE` | Bajo |
| **Total** | | **~7 semanas** | | |

**Directorio de nuevos componentes:**

```
components/
├── v2/
│   ├── Sidebar.tsx
│   ├── SidebarUserMenu.tsx
│   ├── UnifiedComposer.tsx
│   ├── ComposerPlusMenu.tsx
│   ├── ModelSelector.tsx
│   ├── VoiceWaveform.tsx
│   ├── DayBriefingArtifact.tsx
│   ├── SuggestionChips.tsx
│   ├── CaseThreadSidebar.tsx
│   ├── TokenPreview.tsx           ← solo para revisión en desarrollo
│   └── artifacts/
│       ├── CaseStatusArtifact.tsx
│       ├── DocumentsArtifact.tsx
│       ├── RisksArtifact.tsx
│       ├── JudgeArtifact.tsx
│       └── TimelineArtifact.tsx
```

Los componentes existentes en `/components/` permanecen intactos durante todas las fases. El merge se hace fase por fase una vez que cada flag se declara estable.

---

## CHANGELOG v1 → v2

| Aspecto | v1 | v2 | Naturaleza del cambio |
|---|---|---|---|
| Design tokens | 9 ajustes puntuales | Sistema completo de 60+ tokens (color, tipo, espaciado, radio, sombra, animación) | Ampliación — v1 era incompleto para guiar implementación |
| Tipografía | Source Serif Pro (mantener), Inter (mantener) | Tiempos Headline/New Spirit para Serif, Inter para Sans, JetBrains Mono para código — con escala de 9 estilos | Refinamiento — v1 no definía la escala completa |
| Paleta dark mode | No definida | Espejo deliberado con 20 tokens dark + lógica de contraste | Nuevo en v2 |
| Composer | Descripción funcional de `UnifiedComposer` | Wireframe ASCII completo + menú "+" de 11 opciones LexAI + selector de modelo + waveform de voz + especificaciones del botón send | Ampliación crítica — v1 no era suficiente para implementación |
| Sidebar | 5 items simplificados | Wireframe en 2 estados (expandido/colapsado) + secciones "Mis hilos" y "Skills" + footer con menú completo | Ampliación — v1 no definía el estado colapsado |
| Home | Descripción del `DayBriefingArtifact` | Wireframe ASCII completo con mensaje del agente en prosa + chips de sugerencia + detalle de comportamiento | Ampliación — v1 describía el componente, v2 muestra exactamente qué ve el abogado |
| Micro-interacciones | Listadas conceptualmente | 8 interacciones con duración exacta, easing, comportamiento y nota de `prefers-reduced-motion` | Refinamiento — v1 no era implementable sin estas decisiones numéricas |
| Diferenciación competitiva | Mencionada genéricamente | 10 deltas numerados y explicados con argumentos concretos frente a Claude y ChatGPT | Nuevo en v2 — el usuario necesitaba argumentos de venta, no solo argumentos técnicos |
| Plan de implementación | 5 fases con flags `LEXAI_*` | 6 fases con flags `NEXT_PUBLIC_UX_V2_*`, directorio `/components/v2/*`, Fase 0 de tokens independiente | Refinamiento — flags renombrados, directorio explícito, Fase 0 separada reduce riesgo |
| Dependencias | framer-motion "mencionado" | Confirmado instalado (v11.13.1 en package.json) — cero incertidumbre | Verificación factual |
| Decisiones pendientes | No listadas | 5 decisiones explícitas que requieren aprobación antes de avanzar | Nuevo en v2 — evita bloqueos durante implementación |

---

*Propuesta v2 elaborada por el UX/UI Designer Agent de LexAI · 2026-05-20*  
*Pendiente revisión y aprobación de las 5 decisiones de v2.1 por Freddy Rincones antes de iniciar Fase 0*
