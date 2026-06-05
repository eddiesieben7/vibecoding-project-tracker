/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tweak in M6 (tag-style) and M8 (due-tint)
        brandprimary: '#D1D0BB',
        brandaccent: '#F1F291',
        surfacepage: '#FBFAEE',
        surfacecard: '#B5B392',
        textprimary: '#0C0C08',
        textmuted: '#313121',
        feature: '#10B981', // emerald
        bug: '#DC2626',     // crimson
      },
    },
  },
  plugins: [],
};
