/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0D10',
          secondary: '#12161B',
        },
        surface: {
          primary: '#12161B',
          elevated: '#191F26',
        },
        border: {
          subtle: '#2A323B',
        },
        accent: {
          lime: '#C6F36B',
          blue: '#75B8FF',
        },
        text: {
          primary: '#F3F5F7',
          secondary: '#929DA9',
        },
        signal: {
          green: '#36D98A',
          amber: '#FFBD59',
          red: '#FF6268',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'Manrope', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
