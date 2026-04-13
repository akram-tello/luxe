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
        paper: {
          DEFAULT: "#F7F5F0",
          soft: "#EFECE4",
          deep: "#E8E4DB",
        },
        chalk: "#FFFFFF",
        ink: {
          DEFAULT: "#141311",
          2: "#3C3A35",
          3: "#7A766E",
          4: "#A9A59D",
          soft: "#FFFFFF",
          muted: "#F7F5F0",
        },
        hair: {
          DEFAULT: "rgba(20,19,17,0.06)",
          2: "rgba(20,19,17,0.10)",
          3: "rgba(20,19,17,0.18)",
        },
        accent: {
          DEFAULT: "#8B6F47",
          soft: "#B89974",
          deep: "#5E4A2E",
        },
        sage: {
          DEFAULT: "#C8D1B8",
          deep: "#A7B495",
        },
        clay: "#D4C4A8",
        success: "#5A7A5C",
        warn: "#B38A3F",
        danger: "#A74B3E",
        /* legacy compatibility — map to new palette */
        bone: {
          DEFAULT: "#141311",
          soft: "#3C3A35",
        },
        line: "rgba(20,19,17,0.10)",
        gold: {
          DEFAULT: "#8B6F47",
          soft: "#B89974",
          deep: "#5E4A2E",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.04em" }],
      },
      letterSpacing: {
        "tight-2": "-0.02em",
        "tight-3": "-0.03em",
        "tight-4": "-0.04em",
        "wide-1": "0.04em",
        "wide-2": "0.08em",
        "wide-3": "0.14em",
      },
      boxShadow: {
        hair: "0 0 0 1px rgba(20,19,17,0.06)",
        soft: "0 1px 2px rgba(20,19,17,0.04), 0 2px 6px -2px rgba(20,19,17,0.04)",
        card: "0 1px 2px rgba(20,19,17,0.04), 0 12px 32px -16px rgba(20,19,17,0.10)",
        glass: "0 1px 0 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(20,19,17,0.04), 0 20px 60px -30px rgba(20,19,17,0.14)",
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
      backgroundImage: {
        "paper-grain": "radial-gradient(1200px 600px at 80% -10%, rgba(139,111,71,0.06), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(200,209,184,0.18), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
