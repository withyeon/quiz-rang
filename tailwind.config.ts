import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff0f5',
          100: '#ffe0e9',
          200: '#ffc7d9',
          300: '#ffa4c2',
          400: '#ff81ab',
          500: '#ff69b4',
          600: '#ff1493',
          700: '#ff0080',
          800: '#e6006e',
          900: '#cc005c',
        },
        maple: {
          pink: '#ffb6c1',
          gold: '#ffd700',
          rose: '#ff69b4',
          coral: '#ff7f50',
          lavender: '#e6e6fa',
        },
        border: '#e5e7eb',
      },
      backgroundImage: {
        'maple-gradient': 'linear-gradient(135deg, #ffd700 0%, #ffb6c1 50%, #ff69b4 100%)',
        'maple-soft': 'linear-gradient(135deg, rgba(255, 240, 245, 0.9) 0%, rgba(255, 228, 225, 0.9) 100%)',
        'rainbow': 'linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 56%, #4b0082 70%, #9400d3 84%, #ff0000 100%)',
      },
    },
  },
  plugins: [],
}
export default config

