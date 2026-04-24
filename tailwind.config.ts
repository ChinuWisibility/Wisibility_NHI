import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan:   '#00C8F0',
          green:  '#00E887',
          amber:  '#FFB020',
          red:    '#FF4560',
          purple: '#A855F7',
        },
        surface: {
          DEFAULT: '#08111F',
          2:       '#0C1A2E',
          3:       '#162840',
          border:  '#162840',
        },
        bg: {
          dark: '#04080F',
        },
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
