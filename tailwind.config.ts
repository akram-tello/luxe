import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#141414",
          muted: "#1C1C1C",
        },
        bone: {
          DEFAULT: "#F5F2EC",
          soft: "#EDEAE2",
        },
        gold: {
          DEFAULT: "#B8935A",
          soft: "#C9A877",
          deep: "#8C6B38",
        },
        line: "#262626",
        danger: "#B23B3B",
        success: "#3F6B4F",
        warn: "#C79A2A",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        wider: "0.08em",
        widest: "0.2em",
      },
      boxShadow: {
        edge: "0 1px 0 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.06)",
        panel: "0 24px 60px -30px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "hairline-x": "linear-gradient(to right, transparent, rgba(184,147,90,0.3), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
