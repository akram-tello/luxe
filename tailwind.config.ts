import type { Config } from "tailwindcss";

/**
 * Colors are wired to CSS variables (RGB triplets) defined in globals.css,
 * so every hue flips between light and dark themes automatically.
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: rgb("--paper"),
          soft: rgb("--paper-soft"),
          deep: rgb("--paper-deep"),
        },
        chalk: rgb("--chalk"),
        ink: {
          DEFAULT: rgb("--ink"),
          2: rgb("--ink-2"),
          3: rgb("--ink-3"),
          4: rgb("--ink-4"),
          soft: rgb("--chalk"),
          muted: rgb("--paper"),
        },
        hair: {
          DEFAULT: "rgb(var(--hair) / 0.06)",
          2: "rgb(var(--hair) / 0.10)",
          3: "rgb(var(--hair) / 0.18)",
        },
        accent: {
          DEFAULT: rgb("--accent"),
          soft: rgb("--accent-soft"),
          deep: rgb("--accent-deep"),
        },
        sage: {
          DEFAULT: rgb("--sage"),
          deep: rgb("--sage-deep"),
        },
        clay: rgb("--clay"),
        success: rgb("--success"),
        warn: rgb("--warn"),
        danger: rgb("--danger"),
        /* legacy aliases */
        bone: {
          DEFAULT: rgb("--ink"),
          soft: rgb("--ink-2"),
        },
        line: "rgb(var(--hair) / 0.10)",
        /* Valiram brand gold — distinct from the warmer `accent` copper */
        gold: {
          DEFAULT: rgb("--gold"),
          soft: rgb("--gold-soft"),
          deep: rgb("--gold-deep"),
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.04em" }],
      },
      letterSpacing: {
        "tight-1": "-0.01em",
        "tight-2": "-0.02em",
        "tight-3": "-0.03em",
        "tight-4": "-0.04em",
        "wide-1": "0.04em",
        "wide-2": "0.08em",
        "wide-3": "0.14em",
      },
      boxShadow: {
        hair: "0 0 0 1px rgb(var(--hair) / 0.08)",
        soft: "0 1px 2px rgb(var(--hair) / 0.04), 0 2px 6px -2px rgb(var(--hair) / 0.04)",
        card: "0 1px 2px rgb(var(--hair) / 0.04), 0 12px 32px -16px rgb(var(--hair) / 0.10)",
        glass:
          "0 1px 0 0 rgb(var(--chalk) / 0.6) inset, 0 1px 2px rgb(var(--hair) / 0.04), 0 20px 60px -30px rgb(var(--hair) / 0.14)",
      },
      borderRadius: {
        xl: "14px",
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
        "paper-grain":
          "radial-gradient(1200px 600px at 80% -10%, rgb(var(--accent) / 0.05), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgb(var(--sage) / 0.12), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
