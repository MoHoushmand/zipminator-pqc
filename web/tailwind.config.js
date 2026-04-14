/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        quantum: {
          50:  'oklch(0.98 0.015 200 / <alpha-value>)',
          100: 'oklch(0.95 0.03  200 / <alpha-value>)',
          200: 'oklch(0.90 0.06  200 / <alpha-value>)',
          300: 'oklch(0.87 0.10  200 / <alpha-value>)',
          400: 'oklch(0.85 0.13  200 / <alpha-value>)',
          500: 'oklch(0.82 0.15  200 / <alpha-value>)',
          600: 'oklch(0.72 0.17  200 / <alpha-value>)',
          700: 'oklch(0.58 0.17  200 / <alpha-value>)',
          800: 'oklch(0.42 0.15  200 / <alpha-value>)',
          900: 'oklch(0.28 0.10  200 / <alpha-value>)',
          950: 'oklch(0.18 0.06  200 / <alpha-value>)',
        },
        'quantum-cyan': {
          50:  'oklch(0.98 0.015 200 / <alpha-value>)',
          400: 'oklch(0.85 0.13  200 / <alpha-value>)',
          500: 'oklch(0.82 0.15  200 / <alpha-value>)',
          600: 'oklch(0.72 0.17  200 / <alpha-value>)',
          700: 'oklch(0.58 0.17  200 / <alpha-value>)',
          900: 'oklch(0.28 0.10  200 / <alpha-value>)',
        },
        'quantum-amber': {
          50:  'oklch(0.98 0.02  85 / <alpha-value>)',
          300: 'oklch(0.86 0.13  85 / <alpha-value>)',
          400: 'oklch(0.82 0.16  85 / <alpha-value>)',
          500: 'oklch(0.77 0.18  85 / <alpha-value>)',
          600: 'oklch(0.68 0.19  85 / <alpha-value>)',
          700: 'oklch(0.55 0.17  85 / <alpha-value>)',
          900: 'oklch(0.32 0.10  85 / <alpha-value>)',
        },
        'quantum-rose': {
          400: 'oklch(0.78 0.17  10 / <alpha-value>)',
          500: 'oklch(0.72 0.19  10 / <alpha-value>)',
          600: 'oklch(0.62 0.20  10 / <alpha-value>)',
          700: 'oklch(0.50 0.19  10 / <alpha-value>)',
        },
        'quantum-emerald': {
          400: 'oklch(0.84 0.15 155 / <alpha-value>)',
          500: 'oklch(0.79 0.17 155 / <alpha-value>)',
          600: 'oklch(0.69 0.18 155 / <alpha-value>)',
          700: 'oklch(0.55 0.17 155 / <alpha-value>)',
        },
        'quantum-violet': {
          400: 'oklch(0.78 0.14 290 / <alpha-value>)',
          500: 'oklch(0.72 0.17 290 / <alpha-value>)',
          600: 'oklch(0.62 0.19 290 / <alpha-value>)',
          700: 'oklch(0.50 0.18 290 / <alpha-value>)',
        },
        'quantum-bg': {
          DEFAULT: 'oklch(0.10 0.02 250 / <alpha-value>)',
          elevated: 'oklch(0.14 0.025 250 / <alpha-value>)',
          inverted: 'oklch(0.18 0.03  250 / <alpha-value>)',
        },
        nist: {
          blue: '#0066cc',
          gold: '#ffd700',
        },
      },
      backgroundImage: {
        'quantum-mesh':
          'radial-gradient(circle at 20% 20%, oklch(0.82 0.15 200 / 0.10) 0%, transparent 40%), radial-gradient(circle at 80% 30%, oklch(0.72 0.17 290 / 0.08) 0%, transparent 45%), radial-gradient(circle at 50% 90%, oklch(0.79 0.17 155 / 0.06) 0%, transparent 40%)',
        'quantum-gradient':
          'linear-gradient(135deg, oklch(0.82 0.15 200) 0%, oklch(0.72 0.17 290) 50%, oklch(0.77 0.18 85) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2.5s ease-in-out infinite alternate',
        'aurora': 'aurora 18s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 6px  oklch(0.82 0.15 200 / 0.50), 0 0 12px oklch(0.82 0.15 200 / 0.25)' },
          '100%': { boxShadow: '0 0 20px oklch(0.82 0.15 200 / 0.85), 0 0 36px oklch(0.72 0.17 290 / 0.40)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        mono:    ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
