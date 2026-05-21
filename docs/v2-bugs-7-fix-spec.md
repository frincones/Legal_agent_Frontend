# LexAI UX v2 — Spec de corrección: 7 bugs críticos

**Fecha:** 2026-05-21  
**Autor:** Diseñador UX/UI LexAI  
**Estado:** Listo para despacho a fullstack-dev  
**Base de código analizado:** commit `bfdc2a6` (branch `main`)

---

## Resumen ejecutivo

Tras leer el código de los 14 archivos involucrados, los 7 bugs tienen causas bien delimitadas. Cinco de ellos son errores de arquitectura de layout (gaps de componente que falta, cálculo de altura errado, estado colapsado sin spec). Dos son problemas de datos/flujo (threads vacíos, event bus huérfano). Ninguno requiere cambiar el backend.

---

## Orden de aplicación recomendado

| Prioridad | Bug | Impacto | Esfuerzo | Dependencias |
|---|---|---|---|---|
| 1 | #7 Sidebar colapsado feo | Alto (visual regression visible siempre) | Bajo (~30 líneas) | Ninguna |
| 2 | #2 Composer en home muy abajo | Alto (feature principal inoperable) | Bajo (~20 líneas) | Ninguna |
| 3 | #3 UI cortada a 100% zoom | Alto (afecta toda la UX) | Medio (~50 líneas) | Ninguna |
| 4 | #1 Sin composer en matter pages | Alto (bloquea conversación en caso) | Medio (~60 líneas) | Ninguna |
| 5 | #5 Skill click no abre composer | Medio (workaround disponible) | Bajo (~20 líneas) | Bug #1 resuelto primero |
| 6 | #4 Histórico hilos vacío | Medio (UX informacional) | Bajo (diagnóstico) | Backend data |
| 7 | #6 Página /skills vacía | Bajo (feature nueva) | Alto (~200 líneas) | Ninguna |

---

## Bug #1 — Sin composer en páginas de caso (`/v2/casos/[id]`)

### Diagnóstico

`app/(app)/v2/casos/[matterId]/page.tsx` renderiza `<MatterArtifact>` sin ningún composer. El `AssistantSidebar` legacy fue ocultado cuando `UX_V2_HOME=true` (ocultamiento global, no condicional a la ruta). En `/v2/inicio` existe `ComposerV2WithStream` embebido en `DayBriefingPageClient`. En `/v2/casos/*` no hay equivalente. El usuario queda sin medio de comunicación con el agente.

**Opción A (recomendada):** Agregar `ComposerV2WithStream` como zona sticky al fondo del `MatterArtifact`, pasando `matterId` para contextualizar la conversación. Preserva la arquitectura conversacional inline. Evita abrir otro componente (el legacy AssistantSidebar tiene estado propio y su drawer interfiere con el layout v2).

**Opción B:** Reactivar `AssistantSidebar` legacy solo en rutas `/v2/casos/*`. Descartada: mezcla dos sistemas en la misma pantalla, el drawer legacy rompe el layout de columna fija del sidebar v2, y el legacy no pasa `matterId` al stream correctamente.

### Archivos a modificar

**1A. `app/(app)/v2/casos/[matterId]/page.tsx`** — ~5 líneas

El `<main>` debe cambiar de `overflow-auto flex-col` a un layout de dos zonas: scroll superior + compositor sticky inferior.

```
// ANTES (líneas 198-214)
return (
  <AppShell active="casos">
    <main className="flex min-h-0 min-w-0 flex-col overflow-auto">
      <MatterPresenceHeartbeat matterId={matter.id} />
      <MatterArtifact
        matter={matter}
        ...
      />
    </main>
  </AppShell>
);

// DESPUÉS
return (
  <AppShell active="casos">
    <main className="flex min-h-0 min-w-0 flex-col overflow-hidden" style={{ height: '100%' }}>
      <MatterPresenceHeartbeat matterId={matter.id} />
      {/* Zona scroll: todo el artifact */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MatterArtifact
          matter={matter}
          ...
        />
      </div>
      {/* Compositor sticky — solo con flag UX_V2_COMPOSER ON */}
      <MatterComposerStrip matterId={matter.id} />
    </main>
  </AppShell>
);
```

**1B. Crear `components/v2/matter/MatterComposerStrip.tsx`** — nuevo archivo ~60 líneas

Componente client que envuelve `ComposerV2WithStream` con:
- `border-t` separador sutil
- Altura mínima `min-h-[72px]` (solo el input, sin thread visible hasta que haya mensajes)
- `maxHeight: '40vh'` para que no tape el artifact cuando hay conversación
- Escucha también el evento `lexai:open-composer-with-skill` (resuelve Bug #5 en matter pages)

```
// ESTRUCTURA del nuevo archivo
'use client';

import { useState } from 'react';
import { ComposerV2WithStream } from '@/components/v2/composer/ComposerV2WithStream';

const UX_V2_COMPOSER = process.env.NEXT_PUBLIC_UX_V2_COMPOSER === 'true';

export function MatterComposerStrip({ matterId }: { matterId: string }) {
  // Si el flag no está ON, no renderizar nada
  if (!UX_V2_COMPOSER) return null;

  return (
    <div
      className="shrink-0 border-t flex flex-col"
      style={{
        borderColor: 'var(--v2-border-subtle, #E8E7E1)',
        minHeight: '72px',
        maxHeight: '40vh',
      }}
    >
      <ComposerV2WithStream
        matterId={matterId}
        placeholder="Preguntele algo a LexAI sobre este caso..."
        autoFocus={false}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
```

**NOTA sobre el flag:** `MatterComposerStrip` lee `NEXT_PUBLIC_UX_V2_COMPOSER` en runtime en el cliente. Como es un Client Component, `process.env.NEXT_PUBLIC_*` se inyecta en build. Si el flag está ON en prod, el strip aparece. Si está OFF, retorna null sin romper nada. Zero regression.

### Wireframe ASCII — Matter con compositor

```
┌─ /v2/casos/[id] ─────────────────────────────────────┐
│ SidebarV2 (240px) │ main (flex-col, overflow-hidden)  │
│                   │                                    │
│                   │ ┌─ zona scroll (flex-1 ovfl-y) ─┐ │
│                   │ │ MatterHeader                   │ │
│                   │ │  breadcrumb · título · pills   │ │
│                   │ │  CTAs                          │ │
│                   │ │                                │ │
│                   │ │ MatterExecutiveSummary         │ │
│                   │ │  [LexAI resumen en 3 párrafos] │ │
│                   │ │                                │ │
│                   │ │ Sección 1 (acordeón) ▼         │ │
│                   │ │ Sección 2 (acordeón) ▶         │ │
│                   │ │ Sección 3 (acordeón) ▶         │ │
│                   │ │ ...                            │ │
│                   │ └────────────────────────────────┘ │
│                   │                                    │
│                   │ ┌─ MatterComposerStrip ──────────┐ │
│                   │ │ [Preguntele algo sobre este...] │ │
│                   │ │                       [Enviar]  │ │
│                   │ └────────────────────────────────┘ │
└───────────────────┴────────────────────────────────────┘
```

**Líneas estimadas:** page.tsx +8, nuevo archivo ~65 líneas.

---

## Bug #2 — Composer en home muy abajo o fuera de viewport a 100% zoom

### Diagnóstico

`DayBriefingPageClient.tsx` tiene este layout:

```
<div className="flex h-full flex-col">
  <div className="flex-1 min-h-0 overflow-y-auto">   // zona scroll
    <div className="mx-auto max-w-[720px] px-6 pt-8 pb-4">
      ...briefing (longitud variable)
    </div>
  </div>
  <div id="v2-inline-composer" className="shrink-0 border-t flex flex-col"
       style={{ minHeight: '200px', maxHeight: '60vh' }}>
    <ComposerV2WithStream ... />
  </div>
</div>
```

El problema: el `<main>` en `InicioV2Page` tiene `overflow-hidden` y pasa su altura al hijo `DayBriefingPageClient` via `h-full`. PERO el `<main>` tiene `flex-1` sin altura explícita definida. Si el contenedor padre (`AppShell`) no le da una altura calculada correctamente, `h-full` en el hijo hereda `height: auto` (no hay altura fija en la cadena), y `flex-1 overflow-y-auto` funciona como `auto` → el div scroll crece hasta el contenido completo → el compositor queda al fondo de todo el briefing, fuera del viewport.

La solución es garantizar que la cadena de alturas sea correcta desde el root hasta `DayBriefingPageClient`. El `AppShell` devuelve un fragmento `<>sidebar + children</>`. El children es el `<main>`. El fragmento está dentro del grid/flex del layout root (`app/(app)/layout.tsx`). Si ese layout usa `min-h-screen` sin `h-screen` con overflow hidden, el main crece libre.

**Fix:** Cambiar `h-full` a `h-[100dvh]` en el `<div>` raíz del `DayBriefingPageClient` y asegurar que el `<main>` del page use la altura disponible correctamente. Adicionalmente, cuando `messages.length === 0`, centrar el bloque (briefing + composer) en el viewport en lugar de que el briefing ocupe flex-1 completo.

### Archivos a modificar

**2A. `components/v2/home/DayBriefingPageClient.tsx`** — ~15 líneas

```
// ANTES (línea 83)
<div className="flex h-full flex-col">

// DESPUÉS
<div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
```

Además, el wrapper de la zona scroll necesita un comportamiento diferente cuando no hay mensajes en el thread del composer: el usuario debe ver el composer prominente sin hacer scroll. Cuando el briefing es corto y no hay mensajes, el compositor debe estar visible desde el primer frame.

```
// ANTES (líneas 129-137) — zona compositor con minHeight fijo
<div
  id="v2-inline-composer"
  className="shrink-0 border-t flex flex-col"
  style={{
    borderColor: 'var(--v2-border-subtle, #E8E7E1)',
    minHeight: '200px',
    maxHeight: '60vh',
  }}
>

// DESPUÉS — minHeight adaptativo
<div
  id="v2-inline-composer"
  className="shrink-0 border-t flex flex-col"
  style={{
    borderColor: 'var(--v2-border-subtle, #E8E7E1)',
    minHeight: 'clamp(160px, 25vh, 280px)',
    maxHeight: '55vh',
  }}
>
```

**2B. `app/(app)/v2/inicio/page.tsx`** — ~3 líneas

```
// ANTES (líneas 29-36)
<main
  className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
  style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
>

// DESPUÉS
<main
  className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden h-full"
  style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
>
```

**Razón:** `h-full` garantiza que `DayBriefingPageClient` reciba una altura concreta del padre. Sin ella, `h-full` en el hijo resuelve a `auto` cuando el padre es flex sin `height` explícito.

**Líneas estimadas:** DayBriefingPageClient.tsx ~10 cambios, page.tsx ~3 cambios.

---

## Bug #3 — UI cortada o muy grande a 100% zoom

### Diagnóstico

A 100% zoom Chrome, el viewport es exactamente el tamaño físico de la pantalla (1366px en laptop, 1920px en desktop). Los síntomas descritos (h1 enorme, breadcrumb cortado, pills que rompen layout) apuntan a tres causas:

**Causa 3A — `MatterHeader` usa `text-[28px]` fijo sin fluid type.** En una pantalla 1366px con sidebar de 240px, el contenedor del artifact es `max-w-4xl` (896px) dentro de un `<main>` que puede ser ~1100px. El h1 de 28px es razonable, pero el problema es que `max-w-4xl` con `mx-auto` en el `MatterArtifact` no aplica el centrado correctamente cuando el `<main>` no tiene `overflow-x: hidden` y el sidebar anima entre 64 y 240px.

**Causa 3B — `MatterArtifact` usa `max-w-4xl` sin `px` mínimo.** `className="mx-auto w-full max-w-4xl pb-16"` — si el contenedor padre no tiene `min-w-0`, el artifact puede desbordar el ancho calculado del main cuando el sidebar anima.

**Causa 3C — `DayBriefingPageClient` zona scroll tiene `pt-8` (32px top padding) que, sumado al header del saludo y el briefing completo (puede tener 400-600px de contenido), empuja el composer fuera del viewport visible a 768px de alto.**

### Archivos a modificar

**3A. `components/v2/matter/MatterArtifact.tsx`** — ~3 líneas

```
// ANTES (línea 171-173)
<div
  className="mx-auto w-full max-w-4xl pb-16"
  style={{ fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)' }}
>

// DESPUÉS
<div
  className="mx-auto w-full max-w-4xl min-w-0 pb-16"
  style={{ fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)' }}
>
```

**3B. `components/v2/matter/MatterHeader.tsx`** — ~5 líneas

El h1 debe usar tamaño fluid. El `text-[28px]` fijo es el problema principal a pantallas medianas.

```
// ANTES (línea 81)
<h1
  className="mb-3 text-[28px] font-normal leading-tight tracking-[-0.02em]"

// DESPUÉS
<h1
  className="mb-3 font-normal leading-tight tracking-[-0.02em]"
  style={{
    fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',  // 20px-28px fluid
    fontFamily: 'var(--v2-font-serif, Georgia, serif)',
    color: 'var(--v2-text-primary, #1A1916)',
  }}
>
```

**NOTA:** Eliminar el `style` del bloque original que ya tiene `fontFamily` y `color`, ya que ahora están en el `style` unificado. Verificar que no quede duplicado.

**3C. `components/v2/home/DayBriefingPageClient.tsx`** — ~3 líneas

```
// ANTES (línea 90)
<div className="mx-auto max-w-[720px] px-6 pt-8 pb-4">

// DESPUÉS
<div className="mx-auto max-w-[720px] px-6 pt-6 pb-4">
```

Reducir `pt-8` (32px) a `pt-6` (24px) para ganar espacio vertical sin perder respiración.

**3D. `app/(app)/v2/casos/[matterId]/page.tsx`** — ~2 líneas

```
// ANTES (línea 198)
<main className="flex min-h-0 min-w-0 flex-col overflow-auto">

// DESPUÉS (este cambio ya está cubierto en Bug #1)
<main className="flex min-h-0 min-w-0 flex-col overflow-hidden h-full">
```

**Líneas estimadas:** MatterArtifact.tsx ~3, MatterHeader.tsx ~8, DayBriefingPageClient.tsx ~2.

---

## Bug #4 — Histórico de hilos siempre vacío

### Diagnóstico

El flujo completo de datos es:

```
ComposerV2WithStream.handleSend()
  → runSkillStream({ command, input, matter_id, ... })
    → POST /api/skills/execute/stream
      → Railway /v1/skills/execute/stream
        → backend persiste en skill_executions (tabla)
          → GET /v1/threads agrupa skill_executions por firm_id + fecha
            → proxy /api/assistant/threads
              → SidebarHilosList
```

El proxy `app/api/assistant/threads/route.ts` está correctamente implementado y retorna `{ threads: [] }` con fallback silencioso. El `SidebarHilosList` hace `fetch('/api/assistant/threads', { cache: 'no-store' })` una sola vez en `useEffect([])` sin re-fetch.

**Causas probables (en orden de probabilidad):**

**4A (más probable) — El backend `/v1/threads` retorna array vacío porque no hay `skill_executions` del `firm_id` del usuario demo.** Las conversaciones en `/v2/inicio` deben llamar `runSkillStream` que a su vez llama `POST /v1/skills/execute/stream`. Si este endpoint no persiste en `skill_executions` (solo hace streaming sin guardar), no habrá registros. Verificar con `curl -H "Authorization: Bearer <token>" $RAILWAY_API/v1/threads`.

**4B — El proxy retorna `{ threads: [...] }` pero el backend retorna el array directamente sin wrapper.** En el route.ts: `return NextResponse.json(data)` — si el backend devuelve `[{...}]` (array plano), el frontend hace `data.threads ?? []` = `[]` siempre.

**4C — `SidebarHilosList` no refresca tras enviar un mensaje.** No hay mecanismo de invalidación. Una vez cargado vacío, permanece vacío en la sesión aunque se generen threads.

### Fix por causa

**Fix 4A (diagnóstico, no código):** Verificar respuesta real del backend con esta llamada desde el browser network tab o desde terminal:

```
curl -s \
  -H "Authorization: Bearer <ACCESS_TOKEN_SUPABASE>" \
  https://your-railway-url/v1/threads?limit=50 \
  | jq .
```

Si retorna `[]` confirmado, el problema es de datos en el backend (sin skill_executions). No es bug de frontend. Comunicar al equipo backend.

**Fix 4B — `app/api/assistant/threads/route.ts`** — ~8 líneas

Agregar normalización para manejar ambos shapes de respuesta:

```
// ANTES (líneas 38-39)
const data = await res.json();
return NextResponse.json(data);

// DESPUÉS
const data = await res.json();
// Normalizar: el backend puede devolver array plano O { threads: [...] }
const threads = Array.isArray(data)
  ? data
  : (Array.isArray(data?.threads) ? data.threads : []);
return NextResponse.json({ threads });
```

**Fix 4C — `components/v2/shell/SidebarHilosList.tsx`** — ~10 líneas

Agregar escucha de evento para re-fetch cuando se completa un stream:

```
// AGREGAR en el useEffect de carga, después de la función load():
// Re-fetch cuando ComposerV2WithStream completa un ciclo
useEffect(() => {
  const handleNewThread = () => {
    setLoading(true);
    load();  // re-ejecutar fetch
  };
  window.addEventListener('lexai:thread-completed', handleNewThread);
  return () => window.removeEventListener('lexai:thread-completed', handleNewThread);
}, []);
```

Y en `ComposerV2WithStream.tsx`, al finalizar el stream con éxito (evento `done`), disparar:

```
// En el case 'done': del switch, después de updateLastAssistant(...)
window.dispatchEvent(new CustomEvent('lexai:thread-completed'));
```

**Líneas estimadas:** route.ts ~8, SidebarHilosList.tsx ~12, ComposerV2WithStream.tsx ~2.

---

## Bug #5 — Click en skill solo dispara toast, no abre compositor

### Diagnóstico

`SidebarSkillsList.handleSkillClick()` dispara `window.dispatchEvent(new CustomEvent('lexai:open-composer-with-skill', ...))`. El listener está registrado en `ComposerV2WithStream.tsx` (líneas 199-205). El problema: en `/v2/casos/[id]` no hay ningún `ComposerV2WithStream` montado (antes del fix del Bug #1). El evento se dispara al vacío. El toast confirma que la skill fue seleccionada, pero no hay receptor.

La solución más robusta y con menos acoplamiento es hacer que el click navegue con un query param cuando el compositor no está presente en la página actual, y que el compositor en `/v2/inicio` consuma ese param al montar.

### Archivos a modificar

**5A. `components/v2/shell/SidebarSkillsList.tsx`** — ~15 líneas

Cambiar `handleSkillClick` para que detecte si hay un compositor montado antes de disparar el evento:

```
// ANTES
const handleSkillClick = (skill: Skill) => {
  window.dispatchEvent(
    new CustomEvent('lexai:open-composer-with-skill', {
      detail: { command: skill.path, prompt: skill.description ?? '' },
    }),
  );
  toast.info(`Skill seleccionada: ${skill.name}`);
};

// DESPUÉS
const handleSkillClick = (skill: Skill) => {
  // Intentar via evento (funciona si ComposerV2WithStream está montado en la página)
  // Usar CustomEvent con detail para que el composer lo reciba directamente
  const event = new CustomEvent('lexai:open-composer-with-skill', {
    detail: { command: skill.path, prompt: skill.description ?? '' },
    cancelable: true,
  });
  const wasHandled = window.dispatchEvent(event);

  // Si nadie manejó el evento (no hay compositor), navegar a /inicio con query param
  // CustomEvent.defaultPrevented == true si algún listener llamó preventDefault()
  // Como los listeners actuales no llaman preventDefault(), usamos otra estrategia:
  // verificar si el pathname actual tiene compositor montado
  const pathsWithComposer = ['/inicio', '/v2/inicio'];
  const isOnComposerPage = pathsWithComposer.some((p) =>
    window.location.pathname.startsWith(p),
  );

  if (!isOnComposerPage) {
    const params = new URLSearchParams({
      skill: skill.path,
      prompt: skill.description ?? '',
    });
    window.location.href = `/inicio?${params.toString()}`;
    return;
  }

  toast.info(`Skill seleccionada: ${skill.name}`);
};
```

**5B. `components/v2/home/DayBriefingPageClient.tsx`** — ~15 líneas

Leer los query params al montar y pre-rellenar el compositor:

```
// AGREGAR en el useEffect inicial (o un useEffect separado)
useEffect(() => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const skill = params.get('skill');
  const prompt = params.get('prompt');
  if (skill || prompt) {
    const text = [skill, prompt].filter(Boolean).join(' ');
    setPrefillPrompt(text);
    prefillCounterRef.current += 1;
    setPrefillKey(prefillCounterRef.current);
    // Limpiar la URL para no repetir en navegaciones futuras
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

**NOTA:** Con el Bug #1 resuelto (compositor en matter pages), el caso más común de "skill en página sin compositor" desaparece. El fix 5A sigue siendo útil para otras páginas sin compositor (canvas, calendario, etc.).

**Líneas estimadas:** SidebarSkillsList.tsx ~20, DayBriefingPageClient.tsx ~15.

---

## Bug #6 — Página `/skills` muestra solo "próximamente"

### Diagnóstico

`app/(app)/skills/page.tsx` es un stub puro. No hay implementación. La ruta existe y el sidebar la enlaza, pero el contenido es una pantalla de espera genérica.

### Spec del Skills Hub

El Skills Hub debe:
1. Mostrar todos los skills disponibles del firm (desde `/api/skills`).
2. Organizar en grid de cards (3 columnas en desktop, 2 en tablet, 1 en mobile).
3. Cada card: icono Sparkles + nombre + descripción + botón "Usar skill".
4. Filtro por categoría (Redactar, Revisar, Buscar, Analizar).
5. Búsqueda por nombre.
6. Al click "Usar skill": navegar a `/inicio?skill=<path>&prompt=<description>`.
7. Si no hay skills del backend: mostrar los 3 skills fallback del `FALLBACK_SKILLS`.

### Archivos nuevos a crear

**Nuevo: `components/v2/skills/SkillCard.tsx`** — ~70 líneas

```
// ESTRUCTURA
'use client';
// Props: skill: { id, name, path, description, category? }
// Render: Card con icono + nombre + descripción truncada + botón "Usar skill"
// Botón onClick: navega a /inicio?skill=path&prompt=description
```

**Nuevo: `components/v2/skills/SkillsGrid.tsx`** — ~80 líneas

```
// ESTRUCTURA
'use client';
// Props: initialSkills: Skill[]
// State: searchQuery, selectedCategory
// Render: filtros (Input + Select categoría) + grid de SkillCard
// Filtrado client-side sobre initialSkills
```

**Nuevo: `components/v2/skills/SkillsHub.tsx`** — ~60 líneas

```
// ESTRUCTURA
'use client';
// Fetcha /api/skills en cliente
// Estados: loading (3 skeleton cards), error (message + retry), normal (SkillsGrid)
// Pasa skills a SkillsGrid
```

**Modificar: `app/(app)/skills/page.tsx`** — reemplazar stub (~20 líneas)

```
// ANTES (todo el contenido actual es el stub)

// DESPUÉS
import { AppShell } from '@/components/shell/AppShell';
import { SkillsHub } from '@/components/v2/skills/SkillsHub';

export default function SkillsPage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <header className="mb-6">
            <h1 className="text-[24px] font-semibold"
                style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
              Skills de LexAI
            </h1>
            <p className="mt-1 text-[14px]"
               style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
              Herramientas especializadas para tareas jurídicas frecuentes.
            </p>
          </header>
          <SkillsHub />
        </div>
      </main>
    </AppShell>
  );
}
```

### Wireframe ASCII — Skills Hub

```
┌─ /skills ──────────────────────────────────────────────┐
│ Skills de LexAI                                        │
│ Herramientas especializadas para tareas frecuentes     │
│                                                        │
│ ┌─ Filtros ────────────────────────────────────────┐   │
│ │ [Buscar skill...]  Categoría: [Todas ▼]          │   │
│ └──────────────────────────────────────────────────┘   │
│                                                        │
│ ┌─ Grid (3 columnas) ──────────────────────────────┐   │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │   │
│ │ │ * /ask      │ │ * /lex      │ │ * /redactar │ │   │
│ │ │             │ │             │ │ /poderEsp.. │ │   │
│ │ │ Consulta    │ │ Análisis    │ │ Redactar    │ │   │
│ │ │ libre al    │ │ jurídico    │ │ poder espe- │ │   │
│ │ │ asistente   │ │ profundo    │ │ cial        │ │   │
│ │ │             │ │             │ │             │ │   │
│ │ │ [Usar skill]│ │ [Usar skill]│ │ [Usar skill]│ │   │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

**Líneas estimadas:** page.tsx ~25, SkillCard.tsx ~70, SkillsGrid.tsx ~80, SkillsHub.tsx ~60. Total: ~235 líneas nuevas.

---

## Bug #7 — Sidebar colapsado muestra logo "L" + chevron apilados (feo)

### Diagnóstico

En `SidebarV2.tsx`, el header del sidebar en estado colapsado es:

```jsx
<div className={[
  'flex items-center border-b ... px-3 py-3',
  collapsed ? 'justify-center' : 'gap-2',
].join(' ')}>
  <span aria-label="LexAI" className="grid h-[28px] w-[28px] ...">L</span>
  {!collapsed && (
    <div className="min-w-0 flex-1">...</div>
  )}
  <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
</div>
```

Cuando `collapsed=true`:
- El div tiene `justify-center` con `flex-row`.
- El logo "L" (28x28) se centra.
- `SidebarToggle` (28x28) también está en el flex, a la derecha del logo.
- Resultado: logo "L" + botón toggle apilados horizontalmente en 64px de ancho → se ven comprimidos y feos porque los dos elementos compiten por el espacio.

La práctica estándar (Linear, Notion, Vercel, Claude.ai) en sidebar colapsado es:
1. Botón toggle sale del header y se convierte en un botón flotante/pin en el borde derecho del sidebar (o encima del primer nav item).
2. El header colapsado muestra SOLO el logo centrado, sin texto, sin toggle visible (el toggle aparece en hover del sidebar completo o como primer item del nav).
3. Los nav items se muestran solo con icono + tooltip.
4. Las secciones de hilos y skills desaparecen (ya implementado via `{!collapsed && ...}`).

### Archivos a modificar

**7A. `components/v2/shell/SidebarV2.tsx`** — ~25 líneas

Separar el `SidebarToggle` del header. En estado colapsado, el header muestra solo el logo. El toggle se posiciona como overlay en el borde derecho del sidebar.

```
// ANTES — header (líneas 107-137)
<div
  className={[
    'flex items-center border-b border-[var(--v2-border-subtle,#E8E7E1)] px-3 py-3',
    collapsed ? 'justify-center' : 'gap-2',
  ].join(' ')}
>
  {/* Logo LexAI */}
  <span aria-label="LexAI" className="grid h-[28px] w-[28px] shrink-0 ...">L</span>
  {!collapsed && (
    <div className="min-w-0 flex-1">
      <div className="truncate text-[12px] font-semibold ...">LexAI</div>
      <div className="truncate text-[10.5px] ...">{firmName}</div>
    </div>
  )}
  <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
</div>

// DESPUÉS — header con toggle separado
{/* Header: solo logo cuando colapsado, logo+nombre cuando expandido */}
<div
  className="flex items-center border-b border-[var(--v2-border-subtle,#E8E7E1)] px-3 py-3"
  style={{ minHeight: '52px' }}
>
  <span
    aria-label="LexAI"
    className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-md text-[11px] font-bold text-white"
    style={{
      background: 'linear-gradient(135deg, var(--v2-brand-navy,#0E2A5E), var(--v2-accent-copper,#B8763C))',
    }}
  >
    L
  </span>
  {!collapsed && (
    <>
      <div className="min-w-0 flex-1 ml-2">
        <div className="truncate text-[12px] font-semibold text-[var(--v2-brand-navy,#0E2A5E)] leading-none">
          LexAI
        </div>
        <div className="truncate text-[10.5px] text-[var(--v2-text-tertiary,#807E76)] mt-[2px]">
          {firmName}
        </div>
      </div>
      {/* Toggle solo visible en modo expandido, alineado a la derecha */}
      <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
    </>
  )}
</div>

{/* Toggle flotante para modo colapsado: aparece al hacer hover del sidebar,
    posicionado en el borde derecho del sidebar sticky al top */}
{collapsed && (
  <div className="absolute right-0 top-[14px] translate-x-1/2 z-10">
    <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
  </div>
)}
```

**7B. El `motion.aside` en `SidebarV2.tsx` necesita `position: relative`** para que el toggle flotante se posicione correctamente.

```
// ANTES (línea 101-105)
<motion.aside
  animate={{ width: collapsed ? 64 : 240 }}
  transition={{ duration: 0.25, ease: 'easeInOut' }}
  className="flex h-full min-h-0 flex-col overflow-hidden border-r ..."
>

// DESPUÉS — agregar position-relative y overflow-visible en el borde
<motion.aside
  animate={{ width: collapsed ? 64 : 240 }}
  transition={{ duration: 0.25, ease: 'easeInOut' }}
  className="relative flex h-full min-h-0 flex-col border-r ..."
  // NOTA: remover overflow-hidden para que el toggle flotante no se corte
  // El scroll interior ya está en el div hijo .flex-1.overflow-y-auto
>
```

**IMPORTANTE:** Al remover `overflow-hidden` del `motion.aside`, el scroll del cuerpo interior (el div con clase `flex-1 flex-col overflow-y-auto`) sigue funcionando. Solo el aside container deja de clipear el toggle flotante.

**7C. Cuando el sidebar está colapsado, centrar el logo en el header** (ya queda solo con el cambio del punto 7A, sin el toggle al lado).

### Estado colapsado spec completo (64px de ancho)

```
┌─ Sidebar 64px ──┐
│  ┌── L ──┐  [>] │  ← Toggle flotante en borde derecho (hover only o siempre)
│  └───────┘      │
│ ─────────────── │
│      [🏠]       │  ← Inicio (icono, tooltip "Inicio")
│      [📁]       │  ← Casos
│      [📄]       │  ← Documentos
│      [📅]       │  ← Calendario
│      [✨]       │  ← Skills
│ ─────────────── │
│      [🌙]       │  ← ThemeToggle (icono, sin texto)
│      [👤]       │  ← Avatar usuario (sin texto)
└─────────────────┘
```

Referencia de diseño: Linear sidebar colapsado (logo arriba, iconos centrados, toggle en borde), Notion (toggle aparece en hover del sidebar), Vercel (siempre visible en esquina superior derecha del sidebar).

### Wireframe ASCII — Sidebar expandido vs colapsado

```
EXPANDIDO (240px)                   COLAPSADO (64px)
┌──────────────────────────┐        ┌──────────┐
│ [L] LexAI          [◀]  │        │  [L]  [▶]│  ← toggle en borde
│     Despacho Demo        │        │          │    derecho, sticky top
├──────────────────────────┤        ├──────────┤
│ [🏠] Inicio              │        │   [🏠]   │
│ [📁] Casos               │        │   [📁]   │
│ [📄] Documentos          │        │   [📄]   │
│ [📅] Calendario          │        │   [📅]   │
│ [✨] Skills              │        │   [✨]   │
├──────────────────────────┤        ├──────────┤
│ MIS HILOS                │        │  (oculto)│
│  • Caso García vs...     │        │          │
│  • Revisión contrato...  │        │          │
├──────────────────────────┤        ├──────────┤
│ PLANTILLAS Y SKILLS      │        │  (oculto)│
│  • /ask                  │        │          │
│  • /lex                  │        │          │
├──────────────────────────┤        ├──────────┤
│ [🌙]                     │        │   [🌙]   │
│ [👤] Demo User    [···]  │        │   [👤]   │
└──────────────────────────┘        └──────────┘
```

**Líneas estimadas:** SidebarV2.tsx ~30 cambios.

---

## Archivos nuevos a crear

| Archivo | Propósito | Líneas aprox |
|---|---|---|
| `components/v2/matter/MatterComposerStrip.tsx` | Compositor sticky en páginas de caso | ~65 |
| `components/v2/skills/SkillCard.tsx` | Card individual de skill | ~70 |
| `components/v2/skills/SkillsGrid.tsx` | Grid filtrable de skills | ~80 |
| `components/v2/skills/SkillsHub.tsx` | Contenedor con fetch + estados | ~60 |

---

## Lista de tests de regresión a agregar

### Tests de layout (Playwright E2E)

```
tests/v2/layout-regression.spec.ts

1. sidebar-collapsed-no-overlap
   - Colapsar sidebar → verificar que el header solo muestra el logo "L" centrado
   - Verificar que el toggle es visible en el borde derecho sin solaparse con el logo
   - Viewport: 1366x768

2. matter-page-has-composer
   - Navegar a /v2/casos/[id] → verificar que existe #matter-composer-strip
   - Verificar que el textarea del compositor es visible sin scroll
   - Viewport: 1440x900

3. home-composer-visible-at-100-zoom
   - Navegar a /v2/inicio → verificar que #v2-inline-composer es visible en viewport
   - Verificar que el compositor no requiere scroll vertical para ser visible
   - Viewport: 1920x1080

4. home-composer-visible-at-laptop-size
   - Navegar a /v2/inicio
   - Viewport: 1366x768
   - Verificar que #v2-inline-composer está dentro del viewport (getBoundingClientRect)

5. skills-page-renders-cards
   - Navegar a /skills → verificar que hay al menos 1 card de skill visible
   - Verificar que el h1 dice "Skills de LexAI" (no "próximamente")

6. skill-click-navigates-when-no-composer
   - Estar en /v2/casos/[id] → click en un skill del sidebar
   - Verificar redirect a /inicio con query params skill=...

7. threads-list-updates-after-message
   - Enviar un mensaje en /v2/inicio
   - Verificar que SidebarHilosList re-fetcha (interceptar /api/assistant/threads)
```

### Tests unitarios (Vitest)

```
tests/unit/threads-proxy-normalization.test.ts
1. Cuando backend retorna array plano, el proxy devuelve { threads: [...] }
2. Cuando backend retorna { threads: [...] }, el proxy devuelve { threads: [...] }
3. Cuando backend retorna error 500, el proxy devuelve { threads: [], _upstream_status: 500 }

tests/unit/skill-click-navigation.test.ts
1. handleSkillClick en /casos → navega a /inicio?skill=...
2. handleSkillClick en /inicio → dispara evento, no navega
```

---

## Notas de compatibilidad y restricciones

- **Flag UX_V2_COMPOSER:** `MatterComposerStrip` verifica el flag en runtime client-side. Si el flag está OFF (legacy mode), el strip no se renderiza y el behavior legacy se preserva intacto.
- **TypeScript:** Todos los cambios usan tipos ya existentes. `MatterComposerStrip` recibe solo `{ matterId: string }`. No hay breaking changes en interfaces existentes.
- **MarkdownContent legacy:** No se toca. Sigue siendo el renderer usado en `AssistantMessage` dentro de `ComposerV2WithStream`.
- **CanvasEditor legacy:** No se toca. Solo `/v2/casos/[id]` y `/v2/inicio` se modifican.
- **Backend:** Cero cambios de backend. El fix 4B normaliza el response en el proxy de Next.js, no en Railway.
- **Framer-motion:** El cambio de `overflow-hidden` en el `motion.aside` (Bug #7) no afecta la animación de ancho. La animación `width` de framer-motion funciona independiente del overflow del contenedor.
- **Mobile:** `SidebarShellV2.tsx` no se modifica. En mobile el sidebar es un drawer flotante (off-canvas). El collapse de 64px solo aplica en `md:` y superior.
