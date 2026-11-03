/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0c0f17',
          card: '#161b26',
          border: '#242b3d',
          accent: '#10b981', // emerald
          sbp: '#2563eb', // SBP primary blue
          sbpYellow: '#f59e0b',
          glow: 'rgba(16, 185, 129, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
