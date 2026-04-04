import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "civic-bg":         "#080C14",
        "civic-surface":    "#111827",
        "civic-border":     "#1E3A5F",
        "civic-accent":     "#00F3FF",
        "civic-accent-dim": "#00B8C4",
        "civic-text":       "#E2E8F0",
        "civic-muted":      "#64748B",
        "civic-red":        "#FF4444",
        "civic-orange":     "#FF8800",
        "civic-yellow":     "#FFCC00",
        "civic-green":      "#00FF88",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        base: ["14px", { lineHeight: "1.6" }],
      },
      boxShadow: {
        "civic-glow":    "0 0 24px rgba(0,243,255,0.10)",
        "civic-glow-md": "0 0 40px rgba(0,243,255,0.18)",
        "civic-glow-lg": "0 0 60px rgba(0,243,255,0.25)",
      },
      transitionTimingFunction: {
        "civic": "cubic-bezier(0.16, 1, 0.3, 1)",   // spring-like ease
      },
      transitionDuration: {
        "civic": "220ms",
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow":    "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "shimmer":      "shimmer 1.6s ease-in-out infinite",
        "fade-in":      "fadeIn 0.25s ease forwards",
        "slide-up":     "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "flash":        "flash 1.2s ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        flash: {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%":      { backgroundColor: "rgba(255,68,68,0.12)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
