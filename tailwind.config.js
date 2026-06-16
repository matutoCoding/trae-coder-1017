/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        forest: {
          50: "#eef6f1",
          100: "#d6e9dd",
          200: "#afd3bd",
          300: "#7db694",
          400: "#4d946c",
          500: "#2d7750",
          600: "#1f5d3d",
          700: "#1a4a32",
          800: "#163c29",
          900: "#123222",
          950: "#0a1f15",
        },
        cream: {
          50: "#fbf9f4",
          100: "#f7f4ed",
          200: "#f0ebe0",
          300: "#e6dfcd",
          400: "#d8cdb4",
          500: "#c9ba97",
        },
        chrysanthemum: {
          400: "#f0c94f",
          500: "#e8b923",
          600: "#c99c12",
        },
        lily: {
          100: "#f8f5ee",
          200: "#f0ebe0",
        },
        warning: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#c0392b",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', "serif"],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', '"Microsoft YaHei"', "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(31, 77, 58, 0.08), 0 1px 4px -2px rgba(31, 77, 58, 0.06)",
        cardHover: "0 8px 24px -6px rgba(31, 77, 58, 0.15), 0 4px 12px -4px rgba(31, 77, 58, 0.1)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-out forwards",
        countUp: "countUp 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
