import type { Config } from 'tailwindcss';
const v = (n: string) => `var(--${n})`;
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('ink'), mist: v('bg'), azure: v('azure'),
        aqua: v('aqua'), rose: v('sale'), cream: v('bg'),
        sand: v('pic'), mocha: v('azure'),
        espresso: v('ink'), berry: v('sale'),
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: { glass: 'var(--sh)', glow: '0 0 60px var(--glow)' },
      animation: {
        drift: 'drift 22s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        spin60: 'spin60 50s linear infinite',
        marquee: 'marquee 36s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
