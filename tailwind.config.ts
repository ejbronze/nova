import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["DM Serif Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Runtime theme tokens — values injected via CSS variables by ThemeProvider
        "theme-nav-bg":     "var(--theme-nav-bg, #FFFFFF)",
        "theme-nav-text":   "var(--theme-nav-text, #1A1A1A)",
        "theme-nav-border": "var(--theme-nav-border, #EBEBEB)",
        "theme-accent":     "var(--theme-accent, #4F7CFF)",
        "theme-accent-text":"var(--theme-accent-text, #FFFFFF)",
        "theme-accent-light":"var(--theme-accent-light, #EEF2FF)",
        nova: {
          bg: "#FAFAF8",
          card: "#FFFFFF",
          border: "#EBEBEB",
          text: "#1A1A1A",
          muted: "#6B6B6B",
          hint: "#A8A8A8",
        },
        money: {
          DEFAULT: "#4F7CFF",
          bg: "#EEF2FF",
          light: "#F5F7FF",
          border: "#D0DBFF",
        },
        health: {
          DEFAULT: "#5BB88A",
          bg: "#EDFAF3",
          light: "#F4FBF7",
          border: "#B8E8D0",
        },
        life: {
          DEFAULT: "#F5A623",
          bg: "#FEF6E4",
          light: "#FFFBF2",
          border: "#FAD89A",
        },
        danger: {
          DEFAULT: "#F25F5C",
          bg: "#FEF0EF",
          border: "#FACAC9",
        },
      },
      borderRadius: {
        card: "16px",
        md: "12px",
        sm: "8px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        sm: "0 1px 6px rgba(0,0,0,0.04)",
      },
      animation: {
        "fadeIn": "fadeIn 220ms ease",
        "slideUp": "slideUp 280ms ease",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
