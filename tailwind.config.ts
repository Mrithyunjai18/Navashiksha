import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    ns: { yellow: '#F7E7A0', purple: '#5B2A86', pink: '#EC4899', green: '#22C55E', blue: '#3B82F6', cream: '#FFFBEE' },
  }, borderRadius: { xl2: '1.25rem' } } },
  plugins: [],
} satisfies Config;
