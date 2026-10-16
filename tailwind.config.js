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
          primary: '#141010',
          secondary: '#1C1919',
        },
        surface: {
          primary: '#242020',
          elevated: '#302A2A',
        },
        border: {
          subtle: '#413939',
        },
        accent: {
          red: '#A41717',
          burgundy: '#532121',
          rose: '#CEA4A4',
          gold: '#B59447',
        },
        text: {
          primary: '#F2EEEE',
          secondary: '#A4A4A4',
          muted: '#777171',
        },
        road: {
          surface: '#292727',
          markings: '#E0D8D0',
          canvasBg: '#191616',
        },
        signal: {
          green: '#39B86B',
          amber: '#F2B544',
          red: '#E54848',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
