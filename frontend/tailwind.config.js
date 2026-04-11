/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dentBlue: {
          800: '#1F5A6D', // Azul más claro (fondo de apoyo/patrón)
          900: '#0F3B4C', // Azul oscuro principal
        },
        dentGreen: {
          500: '#63C1A6', // Verde principal
          600: '#4FAE94', // Verde más oscuro
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'], // Fuente principal
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
