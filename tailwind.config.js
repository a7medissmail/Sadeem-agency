/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#0D0D0F",
        "black-soft": "#15151a",
        white: "#F5F3F0",
        "white-warm": "#fafaf7",
        accent: "#FF6A00",
        gray: "#B8B8B8",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
