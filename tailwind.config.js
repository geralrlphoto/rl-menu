/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        dark: '#0D0D0D',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'bell-shake': 'bell-shake 1.2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'bell-shake': {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '5%':  { transform: 'rotate(18deg)' },
          '10%': { transform: 'rotate(-16deg)' },
          '15%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-12deg)' },
          '25%': { transform: 'rotate(8deg)' },
          '30%': { transform: 'rotate(-4deg)' },
          '35%': { transform: 'rotate(2deg)' },
          '40%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
