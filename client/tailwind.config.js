/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#090d16',
          panel: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          red: {
            light: '#ef4444',
            DEFAULT: '#991b1b',
            dark: '#7f1d1d',
            glow: 'rgba(153, 27, 27, 0.25)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
