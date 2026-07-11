/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#080810",
          surface: "#0f0f1c",
          elevated: "#141428",
          overlay: "#1a1a35",
        },
        border: {
          subtle: "rgba(255,255,255,0.05)",
          muted: "rgba(255,255,255,0.08)",
          DEFAULT: "rgba(255,255,255,0.1)",
          strong: "rgba(255,255,255,0.16)",
        },
        cyan: {
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          glow: "rgba(34,211,238,0.2)",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          glow: "rgba(139,92,246,0.2)",
        },
        emerald: { 400: "#34d399", 500: "#10b981" },
        rose: { 400: "#fb7185", 500: "#f43f5e" },
        amber: { 400: "#fbbf24", 500: "#f59e0b" },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "spin-slow": "rotateSlow 3s linear infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite",
        shimmer: "shimmer 1.5s infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
