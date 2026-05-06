import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan:   'var(--color-cyber-cyan)',
          green:  'var(--color-cyber-green)',
          amber:  'var(--color-cyber-amber)',
          red:    'var(--color-cyber-red)',
          purple: 'var(--color-cyber-purple)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          2:       'var(--color-surface-2)',
          3:       'var(--color-surface-3)',
          border:  'var(--color-surface-border)',
        },
        bg: {
          dark: 'var(--color-bg-dark)',
        },
        main:   'var(--color-text-main)',
        muted:  'var(--color-text-muted)',
        bright: 'var(--color-text-bright)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body:    ['IBM Plex Sans', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'slide-in':   'slide-in 0.25s ease-out',
        'fade-up':    'fade-up 0.3s ease-out',
      },
    },
  },
  plugins: [forms, typography],
}

export default config
