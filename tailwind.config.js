/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zqp: {
          petrol: "#247a6d",
          "petrol-dark": "#1b5c53",
          "petrol-deep": "#00473d",
          "bg-soft": "#f3f8f7",
          "bg-accent": "#e3eeec",
          border: "#bbd1cd",
          text: "#444444",
          alert: "#722b28",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      }
    },
  },
  plugins: [],
}
