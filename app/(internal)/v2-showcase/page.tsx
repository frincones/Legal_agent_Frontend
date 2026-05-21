'use client';

/**
 * F0-T05 · LexAI UX v2 — Showcase de design tokens
 *
 * Página de validación visual para todos los tokens de la v2.
 * Solo debe usarse localmente con NEXT_PUBLIC_UX_V2_TOKENS=true.
 *
 * Acceso: http://localhost:3000/v2-showcase
 *
 * Secciones:
 *   1. Tipografía (display · title · h2 · body · caption) en serif y sans
 *   2. Paleta de color (brand · accent · neutrales · semánticos)
 *   3. Espaciado (space-1 → space-16)
 *   4. Radios
 *   5. Sombras
 *   6. Motion (hover demo con cada timing)
 */

import { useV2Tokens } from '@/hooks/useV2Tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--v2-space-16)' }}>
      <h2
        style={{
          fontFamily: 'var(--v2-font-sans)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--v2-text-tertiary)',
          marginBottom: 'var(--v2-space-6)',
          paddingBottom: 'var(--v2-space-3)',
          borderBottom: '1px solid var(--v2-border-subtle)',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--v2-font-sans)',
        fontSize: 'var(--v2-text-caption)',
        lineHeight: 'var(--v2-text-caption-lh)',
        color: 'var(--v2-text-tertiary)',
        marginTop: 'var(--v2-space-2)',
      }}
    >
      {children}
    </p>
  );
}

// ─── Sección 1: Tipografía ────────────────────────────────────────────────────

function TypographySection() {
  const scales = [
    { label: 'Display · 48/56 · w400', size: 'var(--v2-text-display)', lh: 'var(--v2-text-display-lh)', w: '400', text: 'Derecho a la justicia' },
    { label: 'Title · 32/40 · w400', size: 'var(--v2-text-title)', lh: 'var(--v2-text-title-lh)', w: '400', text: 'Caso Rodríguez vs. Estado' },
    { label: 'H2 · 24/32 · w500', size: 'var(--v2-text-h2)', lh: 'var(--v2-text-h2-lh)', w: '500', text: 'Hechos del proceso' },
    { label: 'Body · 16/26 · w400', size: 'var(--v2-text-body)', lh: 'var(--v2-text-body-lh)', w: '400', text: 'El demandante interpuso recurso de apelación ante el Tribunal Superior del Distrito Judicial de Bogotá, alegando violación del debido proceso.' },
    { label: 'Caption · 13/18 · w500', size: 'var(--v2-text-caption)', lh: 'var(--v2-text-caption-lh)', w: '500', text: 'Expediente No. 11001-31-03-027-2024-00125-01 · Sala Civil' },
  ];

  return (
    <Section title="1 · Tipografía">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--v2-space-8)' }}>
        {/* Serif column */}
        <div>
          <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--v2-accent-copper)', marginBottom: 'var(--v2-space-6)' }}>
            Serif · Newsreader (New Spirit fallback)
          </p>
          {scales.map((s) => (
            <div key={s.label} style={{ marginBottom: 'var(--v2-space-8)' }}>
              <p
                style={{
                  fontFamily: 'var(--v2-font-serif)',
                  fontSize: s.size,
                  lineHeight: s.lh,
                  fontWeight: s.w,
                  color: 'var(--v2-text-primary)',
                  margin: 0,
                }}
              >
                {s.text}
              </p>
              <Label>{s.label}</Label>
            </div>
          ))}
        </div>

        {/* Sans column */}
        <div>
          <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--v2-brand-navy)', marginBottom: 'var(--v2-space-6)' }}>
            Sans · Inter
          </p>
          {scales.map((s) => (
            <div key={s.label} style={{ marginBottom: 'var(--v2-space-8)' }}>
              <p
                style={{
                  fontFamily: 'var(--v2-font-sans)',
                  fontSize: s.size,
                  lineHeight: s.lh,
                  fontWeight: s.w,
                  color: 'var(--v2-text-primary)',
                  margin: 0,
                }}
              >
                {s.text}
              </p>
              <Label>{s.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Sección 2: Paleta de color ───────────────────────────────────────────────

interface SwatchProps {
  color: string;
  label: string;
  usage: string;
  dark?: boolean;
}

function Swatch({ color, label, usage, dark }: SwatchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v2-space-2)' }}>
      <div
        style={{
          width: '100%',
          height: '64px',
          backgroundColor: color,
          borderRadius: 'var(--v2-radius-md)',
          border: dark ? 'none' : '1px solid var(--v2-border-subtle)',
        }}
      />
      <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--v2-text-primary)', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '11px', color: 'var(--v2-text-tertiary)', margin: 0 }}>
        {color}
      </p>
      <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '11px', color: 'var(--v2-text-secondary)', margin: 0 }}>
        {usage}
      </p>
    </div>
  );
}

function ColorSection() {
  const groups = [
    {
      title: 'Brand · Navy',
      swatches: [
        { color: '#0E2A5E', label: 'brand-navy', usage: 'CTAs primarios, header, links', dark: true },
        { color: '#0a2049', label: 'brand-navy-hover', usage: 'Estado hover de CTAs navy', dark: true },
        { color: '#E8EDF7', label: 'brand-navy-soft', usage: 'Fondos de alertas info, badges', dark: false },
      ],
    },
    {
      title: 'Accent · Cobre',
      swatches: [
        { color: '#B8763C', label: 'accent-copper', usage: 'Highlights editoriales, iconos activos', dark: true },
        { color: '#a16732', label: 'accent-copper-hover', usage: 'Estado hover del cobre', dark: true },
        { color: '#F5EBE0', label: 'accent-copper-soft', usage: 'Fondos de alertas warning', dark: false },
      ],
    },
    {
      title: 'Neutrales · Warm Stone',
      swatches: [
        { color: '#FAFAF7', label: 'bg-base', usage: 'Fondo del body / app shell', dark: false },
        { color: '#FFFFFF', label: 'bg-surface', usage: 'Cards, sidebars, modales', dark: false },
        { color: '#F2F1EC', label: 'bg-subtle', usage: 'Filas alternas, paneles secundarios', dark: false },
        { color: '#E8E7E1', label: 'bg-muted', usage: 'Separadores con peso visual', dark: false },
        { color: '#1A1916', label: 'text-primary', usage: 'Texto principal', dark: true },
        { color: '#4A4944', label: 'text-secondary', usage: 'Texto secundario, labels', dark: true },
        { color: '#807E76', label: 'text-tertiary', usage: 'Placeholder, metadata', dark: true },
        { color: '#B8B6AE', label: 'text-disabled', usage: 'Controles deshabilitados', dark: false },
        { color: '#E8E7E1', label: 'border-subtle', usage: 'Bordes internos, separadores', dark: false },
        { color: '#D4D2CA', label: 'border-default', usage: 'Bordes de inputs, cards', dark: false },
        { color: '#807E76', label: 'border-strong', usage: 'Bordes con énfasis', dark: true },
      ],
    },
    {
      title: 'Semánticos',
      swatches: [
        { color: '#2D7A4F', label: 'success', usage: 'Confirmacion, estado OK', dark: true },
        { color: '#E3F1E8', label: 'success-soft', usage: 'Fondo de alertas OK', dark: false },
        { color: '#8B2C2C', label: 'danger', usage: 'Error, eliminar, riesgo alto', dark: true },
        { color: '#F5E3E3', label: 'danger-soft', usage: 'Fondo de alertas de error', dark: false },
        { color: '#B8763C', label: 'warning', usage: 'Advertencia (alias de copper)', dark: true },
        { color: '#F5EBE0', label: 'warning-soft', usage: 'Fondo de advertencias', dark: false },
        { color: '#0E2A5E', label: 'info', usage: 'Informativo (alias de navy)', dark: true },
        { color: '#E8EDF7', label: 'info-soft', usage: 'Fondo de mensajes info', dark: false },
      ],
    },
  ];

  return (
    <Section title="2 · Paleta de color">
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 'var(--v2-space-10)' }}>
          <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--v2-text-secondary)', marginBottom: 'var(--v2-space-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {g.title}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--v2-space-4)' }}>
            {g.swatches.map((s) => (
              <Swatch key={s.label} {...s} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

// ─── Sección 3: Espaciado ─────────────────────────────────────────────────────

function SpacingSection() {
  const tokens = [
    { name: 'space-1', value: 'var(--v2-space-1)', px: '4px' },
    { name: 'space-2', value: 'var(--v2-space-2)', px: '8px' },
    { name: 'space-3', value: 'var(--v2-space-3)', px: '12px' },
    { name: 'space-4', value: 'var(--v2-space-4)', px: '16px' },
    { name: 'space-5', value: 'var(--v2-space-5)', px: '20px' },
    { name: 'space-6', value: 'var(--v2-space-6)', px: '24px' },
    { name: 'space-8', value: 'var(--v2-space-8)', px: '32px' },
    { name: 'space-10', value: 'var(--v2-space-10)', px: '40px' },
    { name: 'space-12', value: 'var(--v2-space-12)', px: '48px' },
    { name: 'space-16', value: 'var(--v2-space-16)', px: '64px' },
  ];

  return (
    <Section title="3 · Espaciado">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v2-space-3)' }}>
        {tokens.map((t) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--v2-space-4)' }}>
            <p style={{ fontFamily: 'var(--v2-font-mono)', fontSize: '12px', color: 'var(--v2-text-tertiary)', width: '96px', margin: 0, flexShrink: 0 }}>
              --v2-{t.name}
            </p>
            <div
              style={{
                height: '20px',
                width: t.value,
                backgroundColor: 'var(--v2-accent-copper)',
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />
            <p style={{ fontFamily: 'var(--v2-font-mono)', fontSize: '12px', color: 'var(--v2-text-secondary)', margin: 0 }}>
              {t.px}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Sección 4: Radios ────────────────────────────────────────────────────────

function RadiiSection() {
  const tokens = [
    { name: 'radius-sm', value: 'var(--v2-radius-sm)', label: '6px' },
    { name: 'radius-md', value: 'var(--v2-radius-md)', label: '12px' },
    { name: 'radius-lg', value: 'var(--v2-radius-lg)', label: '16px' },
    { name: 'radius-xl', value: 'var(--v2-radius-xl)', label: '20px' },
    { name: 'radius-full', value: 'var(--v2-radius-full)', label: '9999px' },
  ];

  return (
    <Section title="4 · Radios">
      <div style={{ display: 'flex', gap: 'var(--v2-space-6)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {tokens.map((t) => (
          <div key={t.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--v2-space-3)' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: 'var(--v2-brand-navy-soft)',
                border: '2px solid var(--v2-brand-navy)',
                borderRadius: t.value,
              }}
            />
            <p style={{ fontFamily: 'var(--v2-font-mono)', fontSize: '11px', color: 'var(--v2-text-secondary)', margin: 0, textAlign: 'center' }}>
              --v2-{t.name}
            </p>
            <p style={{ fontFamily: 'var(--v2-font-mono)', fontSize: '11px', color: 'var(--v2-text-tertiary)', margin: 0 }}>
              {t.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Sección 5: Sombras ───────────────────────────────────────────────────────

function ShadowsSection() {
  const tokens = [
    { name: 'shadow-sm', value: 'var(--v2-shadow-sm)', label: 'Nivel 1 · Sutil · Separadores ligeros' },
    { name: 'shadow-md', value: 'var(--v2-shadow-md)', label: 'Nivel 2 · Cards, sidebars flotantes' },
    { name: 'shadow-lg', value: 'var(--v2-shadow-lg)', label: 'Nivel 3 · Modales, command palette' },
  ];

  return (
    <Section title="5 · Sombras">
      <div style={{ display: 'flex', gap: 'var(--v2-space-8)', flexWrap: 'wrap' }}>
        {tokens.map((t) => (
          <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v2-space-4)' }}>
            <div
              style={{
                width: '200px',
                height: '100px',
                backgroundColor: 'var(--v2-bg-surface)',
                borderRadius: 'var(--v2-radius-lg)',
                boxShadow: t.value,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ fontFamily: 'var(--v2-font-mono)', fontSize: '12px', color: 'var(--v2-text-tertiary)', margin: 0 }}>
                --v2-{t.name}
              </p>
            </div>
            <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '12px', color: 'var(--v2-text-secondary)', margin: 0, maxWidth: '200px' }}>
              {t.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Sección 6: Motion ────────────────────────────────────────────────────────

function MotionSection() {
  const tokens = [
    {
      name: 'ease-out + micro (150ms)',
      ease: 'var(--v2-ease-out)',
      duration: 'var(--v2-duration-micro)',
      label: 'Micro: tooltips, badges',
    },
    {
      name: 'ease-out + base (250ms)',
      ease: 'var(--v2-ease-out)',
      duration: 'var(--v2-duration-base)',
      label: 'Base: botones, sliders, popovers',
    },
    {
      name: 'ease-in-out + artifact (400ms)',
      ease: 'var(--v2-ease-in-out)',
      duration: 'var(--v2-duration-artifact)',
      label: 'Artifact: paneles grandes, modales',
    },
  ];

  return (
    <Section title="6 · Motion">
      <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '13px', color: 'var(--v2-text-secondary)', marginBottom: 'var(--v2-space-6)' }}>
        Pasa el cursor sobre cada cuadrado para ver la animacion.
      </p>
      <div style={{ display: 'flex', gap: 'var(--v2-space-8)', flexWrap: 'wrap' }}>
        {tokens.map((t) => (
          <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v2-space-4)' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'var(--v2-brand-navy)',
                borderRadius: 'var(--v2-radius-md)',
                cursor: 'pointer',
                transition: `transform ${t.duration} ${t.ease}, background-color ${t.duration} ${t.ease}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15) rotate(3deg)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--v2-accent-copper)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1) rotate(0deg)';
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--v2-brand-navy)';
              }}
            />
            <p style={{ fontFamily: 'var(--v2-font-mono)', fontSize: '11px', color: 'var(--v2-text-secondary)', margin: 0, maxWidth: '160px' }}>
              {t.name}
            </p>
            <p style={{ fontFamily: 'var(--v2-font-sans)', fontSize: '11px', color: 'var(--v2-text-tertiary)', margin: 0, maxWidth: '160px' }}>
              {t.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function V2ShowcasePage() {
  useV2Tokens();

  const isEnabled = process.env.NEXT_PUBLIC_UX_V2_TOKENS === 'true';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--v2-bg-base)',
        padding: 'var(--v2-space-12) var(--v2-space-10)',
        fontFamily: 'var(--v2-font-sans)',
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 'var(--v2-space-12)' }}>
        <p
          style={{
            fontFamily: 'var(--v2-font-sans)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--v2-accent-copper)',
            margin: '0 0 var(--v2-space-3)',
          }}
        >
          LexAI UX v2 · FASE 0
        </p>
        <h1
          style={{
            fontFamily: 'var(--v2-font-serif)',
            fontSize: 'var(--v2-text-display)',
            lineHeight: 'var(--v2-text-display-lh)',
            fontWeight: 'var(--v2-text-display-w)',
            color: 'var(--v2-text-primary)',
            margin: '0 0 var(--v2-space-4)',
          }}
        >
          Design Tokens Showcase
        </h1>
        <p
          style={{
            fontFamily: 'var(--v2-font-sans)',
            fontSize: 'var(--v2-text-body)',
            lineHeight: 'var(--v2-text-body-lh)',
            color: 'var(--v2-text-secondary)',
            maxWidth: '600px',
            margin: 0,
          }}
        >
          Validacion visual de todos los tokens del sistema de diseno v2. Esta pagina no afecta ningun layout existente.
        </p>

        {/* Flag status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--v2-space-2)',
            marginTop: 'var(--v2-space-5)',
            padding: 'var(--v2-space-2) var(--v2-space-4)',
            backgroundColor: isEnabled ? 'var(--v2-success-soft)' : 'var(--v2-danger-soft)',
            borderRadius: 'var(--v2-radius-full)',
            border: `1px solid ${isEnabled ? 'var(--v2-success)' : 'var(--v2-danger)'}`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isEnabled ? 'var(--v2-success)' : 'var(--v2-danger)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--v2-font-mono)',
              fontSize: '12px',
              color: isEnabled ? 'var(--v2-success)' : 'var(--v2-danger)',
              fontWeight: 600,
            }}
          >
            NEXT_PUBLIC_UX_V2_TOKENS = {isEnabled ? 'true' : 'false (tokens no activos en html)'}
          </span>
        </div>
      </header>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--v2-border-default)', marginBottom: 'var(--v2-space-12)' }} />

      {/* Sections */}
      <TypographySection />
      <ColorSection />
      <SpacingSection />
      <RadiiSection />
      <ShadowsSection />
      <MotionSection />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--v2-border-subtle)',
          paddingTop: 'var(--v2-space-8)',
          marginTop: 'var(--v2-space-16)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--v2-font-sans)',
            fontSize: 'var(--v2-text-caption)',
            color: 'var(--v2-text-disabled)',
            margin: 0,
          }}
        >
          LexAI UX v2 · Fase 0 · Solo uso interno · Serif: Newsreader (fallback de New Spirit) · Sans: Inter
        </p>
      </footer>
    </div>
  );
}
