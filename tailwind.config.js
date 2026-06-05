/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brandprimary: '#D1D0BB',
        brandaccent: '#F1F291',
        surfacepage: '#FBFAEE',
        surfacecard: '#B5B392',
        textprimary: '#0C0C08',
        textmuted: '#313121',
        // TODO M6 tag-style: replace with values from DESIGN.md §2 once B fills them in
        feature: '#10B981',
        bug: '#DC2626',
        // TODO M8 due-tint: add due-safe, due-warning, due-overdue, due-neutral
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
