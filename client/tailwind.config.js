/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shaba: {
          dark: "#0a0a0a",
          blue: "#1e3a8a",
          lightBlue: "#3b82f6",
          accent: "#60a5fa",
        },
      },
      backgroundImage: {
        'shaba-gradient': 'linear-gradient(to bottom right, #1e3a8a, #000000)',
        'blue-gradient': 'linear-gradient(to right, #3b82f6, #1e3a8a)',
      },
    },
  },
  plugins: [],
}

