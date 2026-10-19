/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-card-elevated)',
          border: 'var(--border-color)',
          'border-subtle': 'var(--border-subtle)',
          text: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          red: 'var(--accent-red)',
          gold: 'var(--metallic-gold)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        surface: {
          primary: 'var(--bg-secondary)',
          elevated: 'var(--bg-card-elevated)',
        },
        border: {
          subtle: 'var(--border-color)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        signal: {
          green: 'var(--signal-green)',
          amber: 'var(--signal-amber)',
          red: 'var(--signal-red)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'Manrope', 'system-ui', 'sans-serif'],
      },
      screens: {
        'xs': '420px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
      }
    },
  },
  plugins: [],
}
