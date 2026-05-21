import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Sistema actual ────────────────────────────────────────────────
        // LexAI design tokens (mapped to CSS custom properties so the
        // existing template can be themed via [data-mode] / [data-direction]).
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        'bg-elev': 'rgb(var(--bg-elev-rgb) / <alpha-value>)',
        'bg-sunken': 'rgb(var(--bg-sunken-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2-rgb) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3-rgb) / <alpha-value>)',
        'ink-4': 'rgb(var(--ink-4-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong-rgb) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft-rgb) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink-rgb) / <alpha-value>)',
        ok: 'rgb(var(--ok-rgb) / <alpha-value>)',
        'ok-soft': 'rgb(var(--ok-soft-rgb) / <alpha-value>)',
        warn: 'rgb(var(--warn-rgb) / <alpha-value>)',
        'warn-soft': 'rgb(var(--warn-soft-rgb) / <alpha-value>)',
        danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
        'danger-soft': 'rgb(var(--danger-soft-rgb) / <alpha-value>)',
        purple: 'rgb(var(--purple-rgb) / <alpha-value>)',
        'purple-soft': 'rgb(var(--purple-soft-rgb) / <alpha-value>)',

        // ─── LexAI UX v2 (F0-T03) ────────────────────────────────────────
        // Prefijo "v2-" para evitar colisiones. Solo activos bajo [data-v2-tokens].
        'v2-brand-navy': 'var(--v2-brand-navy)',
        'v2-brand-navy-hover': 'var(--v2-brand-navy-hover)',
        'v2-brand-navy-soft': 'var(--v2-brand-navy-soft)',
        'v2-accent-copper': 'var(--v2-accent-copper)',
        'v2-accent-copper-hover': 'var(--v2-accent-copper-hover)',
        'v2-accent-copper-soft': 'var(--v2-accent-copper-soft)',
        'v2-bg-base': 'var(--v2-bg-base)',
        'v2-bg-surface': 'var(--v2-bg-surface)',
        'v2-bg-subtle': 'var(--v2-bg-subtle)',
        'v2-bg-muted': 'var(--v2-bg-muted)',
        'v2-text-primary': 'var(--v2-text-primary)',
        'v2-text-secondary': 'var(--v2-text-secondary)',
        'v2-text-tertiary': 'var(--v2-text-tertiary)',
        'v2-text-disabled': 'var(--v2-text-disabled)',
        'v2-text-inverse': 'var(--v2-text-inverse)',
        'v2-border-subtle': 'var(--v2-border-subtle)',
        'v2-border-default': 'var(--v2-border-default)',
        'v2-border-strong': 'var(--v2-border-strong)',
        'v2-success': 'var(--v2-success)',
        'v2-success-soft': 'var(--v2-success-soft)',
        'v2-danger': 'var(--v2-danger)',
        'v2-danger-soft': 'var(--v2-danger-soft)',
        'v2-warning': 'var(--v2-warning)',
        'v2-warning-soft': 'var(--v2-warning-soft)',
        'v2-info': 'var(--v2-info)',
        'v2-info-soft': 'var(--v2-info-soft)',
      },
      fontFamily: {
        // ─── Sistema actual ────────────────────────────────────────────────
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', '"Iowan Old Style"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
        // ─── v2 ───────────────────────────────────────────────────────────
        'v2-serif': ['var(--v2-font-serif)', 'Newsreader', 'Georgia', 'serif'],
        'v2-sans': ['var(--v2-font-sans)', 'system-ui', 'sans-serif'],
        'v2-mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // ─── v2 (F0-T03) ──────────────────────────────────────────────────
        'v2-display': ['var(--v2-text-display)', { lineHeight: 'var(--v2-text-display-lh)', fontWeight: 'var(--v2-text-display-w)' }],
        'v2-title': ['var(--v2-text-title)', { lineHeight: 'var(--v2-text-title-lh)', fontWeight: 'var(--v2-text-title-w)' }],
        'v2-h2': ['var(--v2-text-h2)', { lineHeight: 'var(--v2-text-h2-lh)', fontWeight: 'var(--v2-text-h2-w)' }],
        'v2-body': ['var(--v2-text-body)', { lineHeight: 'var(--v2-text-body-lh)', fontWeight: 'var(--v2-text-body-w)' }],
        'v2-caption': ['var(--v2-text-caption)', { lineHeight: 'var(--v2-text-caption-lh)', fontWeight: 'var(--v2-text-caption-w)' }],
      },
      borderRadius: {
        // ─── Sistema actual ────────────────────────────────────────────────
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        full: '999px',
        // ─── v2 ───────────────────────────────────────────────────────────
        'v2-sm': 'var(--v2-radius-sm)',
        'v2-md': 'var(--v2-radius-md)',
        'v2-lg': 'var(--v2-radius-lg)',
        'v2-xl': 'var(--v2-radius-xl)',
        'v2-full': 'var(--v2-radius-full)',
      },
      spacing: {
        // ─── Sistema actual ────────────────────────────────────────────────
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
        8: '64px',
        // ─── v2 ───────────────────────────────────────────────────────────
        'v2-1': 'var(--v2-space-1)',
        'v2-2': 'var(--v2-space-2)',
        'v2-3': 'var(--v2-space-3)',
        'v2-4': 'var(--v2-space-4)',
        'v2-5': 'var(--v2-space-5)',
        'v2-6': 'var(--v2-space-6)',
        'v2-8': 'var(--v2-space-8)',
        'v2-10': 'var(--v2-space-10)',
        'v2-12': 'var(--v2-space-12)',
        'v2-16': 'var(--v2-space-16)',
      },
      boxShadow: {
        // ─── Sistema actual ────────────────────────────────────────────────
        1: '0 1px 0 rgba(20,18,14,0.04), 0 1px 2px rgba(20,18,14,0.04)',
        2: '0 1px 0 rgba(20,18,14,0.04), 0 6px 18px -8px rgba(20,18,14,0.18)',
        3: '0 2px 0 rgba(20,18,14,0.04), 0 24px 48px -16px rgba(20,18,14,0.24)',
        hud: '0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 36px -10px rgba(20,18,14,0.22), 0 2px 6px -2px rgba(20,18,14,0.12)',
        // ─── v2 ───────────────────────────────────────────────────────────
        'v2-sm': 'var(--v2-shadow-sm)',
        'v2-md': 'var(--v2-shadow-md)',
        'v2-lg': 'var(--v2-shadow-lg)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'hud-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 currentColor' },
          '50%': { boxShadow: '0 0 0 10px transparent' },
        },
        'hud-breathe': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
        // F4 · Accordion Radix animations
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'hud-pulse': 'hud-pulse 1.4s ease-in-out infinite',
        'hud-breathe': 'hud-breathe 3.5s ease-in-out infinite',
        blink: 'blink 1s steps(2) infinite',
        // F4 · Accordion
        'accordion-down': 'accordion-down 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'accordion-up': 'accordion-up 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionTimingFunction: {
        // ─── v2 (F0-T03) ──────────────────────────────────────────────────
        'v2-out': 'var(--v2-ease-out)',
        'v2-in-out': 'var(--v2-ease-in-out)',
      },
      transitionDuration: {
        // ─── v2 (F0-T03) ──────────────────────────────────────────────────
        'v2-micro': 'var(--v2-duration-micro)',
        'v2-base': 'var(--v2-duration-base)',
        'v2-artifact': 'var(--v2-duration-artifact)',
      },
    },
  },
  plugins: [],
};

export default config;
