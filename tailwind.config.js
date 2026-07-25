/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        surfaceHighlight: '#262626',
        primary: '#4f46e5', // Indigo 600
        primaryHover: '#4338ca', // Indigo 700
        accent: '#f97316', // Orange 500 for the 'fire' vibe
        success: '#22c55e',
        danger: '#ef4444',
        textMain: '#f5f5f5',
        textMuted: '#a3a3a3',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
