/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sorbet: {
          cream: '#f3ede1',
          green: '#10372a',
          coral: '#ff7a59',
          lavender: '#cdbdff',
          yellow: '#f4c95d',
          white: '#fffaf0',
        },
      },
      fontFamily: {
        sans: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 30px 60px rgba(16, 55, 42, 0.14)',
      },
    },
  },
  plugins: [],
};