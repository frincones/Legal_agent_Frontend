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
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', '"Iowan Old Style"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        full: '999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        7: '48px',
        8: '64px',
      },
      boxShadow: {
        1: '0 1px 0 rgba(20,18,14,0.04), 0 1px 2px rgba(20,18,14,0.04)',
        2: '0 1px 0 rgba(20,18,14,0.04), 0 6px 18px -8px rgba(20,18,14,0.18)',
        3: '0 2px 0 rgba(20,18,14,0.04), 0 24px 48px -16px rgba(20,18,14,0.24)',
        hud: '0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 36px -10px rgba(20,18,14,0.22), 0 2px 6px -2px rgba(20,18,14,0.12)',
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
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'hud-pulse': 'hud-pulse 1.4s ease-in-out infinite',
        'hud-breathe': 'hud-breathe 3.5s ease-in-out infinite',
        blink: 'blink 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
