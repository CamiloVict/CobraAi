import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cobra: {
          bg: "#080604",
          bg2: "#0F0B07",
          coral: "#D85A30",
          teal: "#1D9E75",
          amber: "#EF9F27",
          accent: "#D85A30",
          positive: "#0F6E56",
          danger: "#A32D2D",
          dark: "#0A0806"
        }
      }
    }
  },
  plugins: []
};

export default config;
