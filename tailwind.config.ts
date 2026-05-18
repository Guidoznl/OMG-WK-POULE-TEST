import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0F1F',  // page bg
          900: '#0E1429',  // surface bg
          800: '#151B33',  // raised surface
          700: '#1A2342',  // tile bg
          600: '#2A3556',  // border
          500: '#4A5478',  // muted text
          400: '#6B7494',  // secondary text
          200: '#C5CCE3',  // light text
          50:  '#FFFFFF',  // primary text
        },
        accent: {
          orange: '#FF6B1A',  // OppoSuits hero accent
          mint:   '#3FD37F',  // success
          coral:  '#E66060',  // danger
          amber:  '#F2B544',  // warning
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
