/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B9D',
          light: '#FFB3BA',
        },
        secondary: {
          DEFAULT: '#C77DFF',
        },
        accent: {
          DEFAULT: '#FFD700',
        },
      },
    },
  },
  plugins: [],
};

