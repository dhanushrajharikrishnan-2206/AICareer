import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#F8FAFC",
        gold: "#D97706",
        sage: "#059669",
        coral: "#E11D48",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          900: "#312E81"
        }
      },
      boxShadow: {
        "glow-indigo": "0 0 25px -5px rgba(99, 102, 241, 0.3)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)"
      }
    }
  },
  plugins: []
};
export default config;
