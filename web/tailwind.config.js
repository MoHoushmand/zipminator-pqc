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
                // QDaria quantum token palette (OKLCH — mapped to Tailwind for className usage)
                quantum: {
                    50:  'oklch(0.97 0.03 200)',
                    100: 'oklch(0.94 0.05 200)',
                    200: 'oklch(0.90 0.08 200)',
                    300: 'oklch(0.87 0.11 200)',
                    400: 'oklch(0.84 0.13 200)',
                    500: 'var(--quantum-cyan)',    /* oklch(0.82 0.15 200) */
                    600: 'oklch(0.73 0.15 200)',
                    700: 'oklch(0.62 0.15 200)',
                    800: 'oklch(0.50 0.13 200)',
                    900: 'oklch(0.36 0.10 200)',
                    950: 'oklch(0.22 0.07 200)',
                },
                // QDaria semantic quantum tokens
                'quantum-amber':   'var(--quantum-amber)',
                'quantum-rose':    'var(--quantum-rose)',
                'quantum-emerald': 'var(--quantum-emerald)',
                'quantum-violet':  'var(--quantum-violet)',
                nist: {
                    blue: 'oklch(0.48 0.18 258)',
                    gold: 'oklch(0.88 0.18 90)',
                }
            },
            backgroundImage: {
                'quantum-gradient': 'linear-gradient(135deg, var(--quantum-cyan) 0%, var(--quantum-violet) 100%)',
                'quantum-mesh': 'radial-gradient(circle at 50% 50%, oklch(0.82 0.15 200 / 0.1) 0%, transparent 50%)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.5), 0 0 10px rgba(99, 102, 241, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8), 0 0 30px rgba(99, 102, 241, 0.4)' },
                },
            },
            fontFamily: {
                // QDaria design system fonts (01-stack.md)
                sans: ['var(--font-body)', 'var(--font-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
                display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
                body: ['var(--font-body)', 'DM Sans', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
