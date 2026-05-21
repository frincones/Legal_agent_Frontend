# LexAI UX v2 — Design Tokens

> Fase 0 del plan UX/UI v2. Los tokens están definidos en `styles/tokens-v2.css`
> y se activan únicamente bajo el atributo `[data-v2-tokens]` en el elemento `<html>`.
> El hook `hooks/useV2Tokens.ts` gestiona la activación via env var.

## Activación

```bash
# .env.local
NEXT_PUBLIC_UX_V2_TOKENS=true
```

```tsx
// En un client component
import { useV2Tokens } from '@/hooks/useV2Tokens';
useV2Tokens();
```

## Showcase visual

```bash
NEXT_PUBLIC_UX_V2_TOKENS=true pnpm dev
# Visitar: http://localhost:3000/v2-showcase
```

---

## Tabla de tokens

### Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--v2-font-serif` | Newsreader (fallback New Spirit), Georgia | Títulos editoriales, display |
| `--v2-font-sans` | Inter, system-ui | Cuerpo de texto, UI |
| `--v2-font-mono` | JetBrains Mono | Código, expedientes, IDs |
| `--v2-text-display` | 48px / lh 56px / w400 | Hero, portadas de casos |
| `--v2-text-title` | 32px / lh 40px / w400 | Títulos de sección principales |
| `--v2-text-h2` | 24px / lh 32px / w500 | Subtítulos, encabezados de card |
| `--v2-text-body` | 16px / lh 26px / w400 | Texto de lectura, AI responses |
| `--v2-text-caption` | 13px / lh 18px / w500 | Metadata, labels, badges |

### Brand

| Token | Valor hex | Uso |
|---|---|---|
| `--v2-brand-navy` | `#0E2A5E` | CTAs primarios, header, links activos |
| `--v2-brand-navy-hover` | `#0a2049` | Estado hover de controles navy |
| `--v2-brand-navy-soft` | `#E8EDF7` | Fondos info, badges navy |
| `--v2-accent-copper` | `#B8763C` | Highlights editoriales, iconos activos, warnings |
| `--v2-accent-copper-hover` | `#a16732` | Estado hover del cobre |
| `--v2-accent-copper-soft` | `#F5EBE0` | Fondos de advertencias, selecciones |

### Neutrales (warm stone)

| Token | Valor hex | Uso |
|---|---|---|
| `--v2-bg-base` | `#FAFAF7` | Fondo del body / app shell |
| `--v2-bg-surface` | `#FFFFFF` | Cards, sidebars, modales |
| `--v2-bg-subtle` | `#F2F1EC` | Filas alternas, paneles secundarios |
| `--v2-bg-muted` | `#E8E7E1` | Separadores con peso visual |
| `--v2-text-primary` | `#1A1916` | Texto principal (contraste > 7:1 sobre bg-base) |
| `--v2-text-secondary` | `#4A4944` | Labels, texto secundario |
| `--v2-text-tertiary` | `#807E76` | Placeholder, metadata |
| `--v2-text-disabled` | `#B8B6AE` | Controles deshabilitados |
| `--v2-text-inverse` | `#FAFAF7` | Texto sobre fondos oscuros |
| `--v2-border-subtle` | `#E8E7E1` | Bordes internos, separadores |
| `--v2-border-default` | `#D4D2CA` | Bordes de inputs, cards |
| `--v2-border-strong` | `#807E76` | Bordes con énfasis |

### Semánticos

| Token | Valor hex | Uso |
|---|---|---|
| `--v2-success` | `#2D7A4F` | Confirmación, estado OK |
| `--v2-success-soft` | `#E3F1E8` | Fondo de alertas OK |
| `--v2-danger` | `#8B2C2C` | Error, eliminar, riesgo alto |
| `--v2-danger-soft` | `#F5E3E3` | Fondo de alertas de error |
| `--v2-warning` | `#B8763C` | Advertencia (alias de copper) |
| `--v2-warning-soft` | `#F5EBE0` | Fondo de advertencias |
| `--v2-info` | `#0E2A5E` | Informativo (alias de navy) |
| `--v2-info-soft` | `#E8EDF7` | Fondo de mensajes info |

### Espaciado (base 4 px)

| Token | Valor | Tailwind class |
|---|---|---|
| `--v2-space-1` | 4px | `p-v2-1`, `m-v2-1`, `gap-v2-1` |
| `--v2-space-2` | 8px | `p-v2-2` ... |
| `--v2-space-3` | 12px | |
| `--v2-space-4` | 16px | |
| `--v2-space-5` | 20px | |
| `--v2-space-6` | 24px | |
| `--v2-space-8` | 32px | |
| `--v2-space-10` | 40px | |
| `--v2-space-12` | 48px | |
| `--v2-space-16` | 64px | |

### Radios

| Token | Valor | Tailwind class |
|---|---|---|
| `--v2-radius-sm` | 6px | `rounded-v2-sm` |
| `--v2-radius-md` | 12px | `rounded-v2-md` |
| `--v2-radius-lg` | 16px | `rounded-v2-lg` |
| `--v2-radius-xl` | 20px | `rounded-v2-xl` |
| `--v2-radius-full` | 9999px | `rounded-v2-full` |

### Sombras

| Token | Uso | Tailwind class |
|---|---|---|
| `--v2-shadow-sm` | Nivel 1 · separadores ligeros | `shadow-v2-sm` |
| `--v2-shadow-md` | Nivel 2 · cards, sidebars flotantes | `shadow-v2-md` |
| `--v2-shadow-lg` | Nivel 3 · modales, command palette | `shadow-v2-lg` |

### Motion

| Token | Valor | Uso |
|---|---|---|
| `--v2-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas de elementos |
| `--v2-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transiciones de estado |
| `--v2-duration-micro` | 150ms | Tooltips, badges, hover states |
| `--v2-duration-base` | 250ms | Botones, sliders, popovers |
| `--v2-duration-artifact` | 400ms | Paneles grandes, modales, canvas |

---

## Convención de uso en componentes v2

```tsx
// CSS variables directas (inline style o CSS modules)
<div style={{ backgroundColor: 'var(--v2-bg-surface)', borderRadius: 'var(--v2-radius-md)' }}>

// Tailwind classes v2
<div className="bg-v2-bg-surface rounded-v2-md shadow-v2-md text-v2-text-primary">

// NO mezclar con tokens del sistema actual en el mismo componente
// NO usar en componentes fuera de components/v2/ hasta el switch final (Fase 7)
```

## Feature flags por fase

| Flag | Fase | Estado |
|---|---|---|
| `NEXT_PUBLIC_UX_V2_TOKENS` | 0 | Implementado |
| `NEXT_PUBLIC_UX_V2_SHELL` | 1 | Pendiente |
| `NEXT_PUBLIC_UX_V2_HOME` | 2 | Pendiente |
| `NEXT_PUBLIC_UX_V2_COMPOSER` | 3 | Pendiente |
| `NEXT_PUBLIC_UX_V2_MATTER` | 4 | Pendiente |
| `NEXT_PUBLIC_UX_V2_CANVAS` | 5 | Pendiente |
| `NEXT_PUBLIC_UX_V2_DARK` | 6 | Pendiente |

## Nota sobre New Spirit

New Spirit no está disponible en `next/font/google` (versión 14.2.20 del proyecto).
Se usa **Newsreader** como fallback aprobado — editorial serif de proporciones similares,
disponible en la librería de Next.js. La variable CSS `--font-new-spirit` apunta a Newsreader.
En fases futuras, cuando Next.js incluya New Spirit o se use `next/font/local`,
solo se cambia `app/fonts.ts` sin tocar los tokens ni los componentes.
