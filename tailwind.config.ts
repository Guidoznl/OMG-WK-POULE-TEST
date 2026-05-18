import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware "ink" palette. Maps to CSS variables so it switches when
        // [data-theme="pink"] is set on <html>.
        ink: {
          950: 'var(--c-bg-page)',
          900: 'var(--c-bg-surface)',
          800: 'var(--c-bg-raised)',
          700: 'var(--c-bg-tile)',
          600: 'var(--c-border)',
          500: 'var(--c-text-muted)',
          400: 'var(--c-text-sub)',
          200: 'var(--c-text-200)',
          50:  'var(--c-text-50)',
        },
        accent: {
          // "orange" is the primary accent. In pink theme it becomes pink via
          // the --c-accent CSS variable. Component code stays unchanged.
          orange: 'var(--c-accent)',
          // Status colors stay constant across themes (success = green, etc.)
          mint:   '#3FD37F',
          coral:  '#E66060',
          amber:  '#F2B544',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        tile: '14px',
      },
    },
  },
  plugins: [],
}

export default config
