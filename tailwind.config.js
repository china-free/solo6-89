/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        'space': {
          bg: '#050614',
          panel: 'rgba(10, 14, 34, 0.72)',
          border: 'rgba(94, 242, 255, 0.28)',
        },
        'cyber': {
          cyan: '#5ef2ff',
          amber: '#ffb454',
          red: '#ff5a6a',
          green: '#5dffb0',
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(94, 242, 255, 0.45)',
        'glow-amber': '0 0 20px rgba(255, 180, 84, 0.55)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
