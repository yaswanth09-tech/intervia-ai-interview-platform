/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14162B',
        paper: '#F5F6F8',
        panel: '#FFFFFF',
        border: '#E2E4EC',
        muted: '#6B7089',
        signal: {
          DEFAULT: '#4640DE',
          soft: '#EDECFB',
        },
        good: '#0F9B6E',
        warn: '#D97B0B',
        bad: '#D6455B',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}
