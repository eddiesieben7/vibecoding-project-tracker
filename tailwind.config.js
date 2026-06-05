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
        feature: '#016509',
        bug: '#820D0D',
        duesafe: '#9AD29F',
        duewarning: '#EED380',
        dueoverdue: '#EB9373',
        dueneutral: '#9BB8DA',
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
