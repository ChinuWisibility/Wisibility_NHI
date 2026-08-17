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
        brand: {
          DEFAULT: '#2563EB',
          hover:   '#1D4ED8',
          light:   '#3b82f6',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono:    ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        clay: '14px',
      },
      boxShadow: {
        clay: '0 3px 0 rgba(37,99,235,0.18), 0 6px 12px rgba(0,0,0,0.04)',
        'clay-lg': '0 8px 0 rgba(30,58,138,0.35), 0 12px 24px rgba(37,99,235,0.25)',
        'clay-card': '0 16px 0 rgba(37,99,235,0.22), 0 24px 48px rgba(0,0,0,0.10)',
        card: '0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.06)',
        'card-hover': '0 4px 16px rgba(15,23,42,0.10), 0 0 0 1px rgba(37,99,235,0.18)',
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
