import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Accent for the whole app. Standard Tailwind emerald, named so it can
        // be re-themed in one place.
        brand: {
          50: '#fef5f0',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#ff8718',
          600: '#f06c00',
          700: '#e55000',
          800: '#c2410c',
        },
      },
    },
  },
  plugins: [],
}

export default config
