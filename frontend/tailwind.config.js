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
        background: '#090a0f',
        surface: {
          DEFAULT: '#12141c',
          card: '#161924',
          hover: '#1e2230',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        brand: {
          purple: '#8b5cf6',
          'purple-dark': '#6d28d9',
          blue: '#38bdf8',
          'blue-dark': '#0284c7',
          neon: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif']
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.5))' },
          '50%': { opacity: .6, filter: 'drop-shadow(0 0 5px rgba(139, 92, 246, 0.2))' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
