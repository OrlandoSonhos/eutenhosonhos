/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // sm: '640px' (default)
        // md: '768px' (default)
        // lg: '1024px' (default)
        // xl: '1280px' (default)
        // 2xl: '1536px' (default)
      },
      colors: {
        'brand-primary': '#2d7d8e',
        'brand-primary-dark': '#1e5a68',
        'brand-primary-light': '#4a9fb0',
        'brand-accent': '#f4b942',
        'brand-accent-dark': '#e6a635',
        'brand-accent-light': '#f7c965',
        'brand-teal': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2d7d8e',
          600: '#1e5a68',
          700: '#4a9fb0',
          800: '#134e4a',
          900: '#042f2e',
        },
        'brand-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#f4b942',
          500: '#e6a635',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      aspectRatio: {
        '16/9': '16 / 9',
        '16/8': '16 / 8',
        '16/7': '16 / 7',
        '16/6': '16 / 6',
        '16/5': '16 / 5',
        '16/4': '16 / 4',
        '4/3': '4 / 3',
        '3/2': '3 / 2',
      },
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
}